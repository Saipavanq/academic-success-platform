from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_exam_reminders():
    from apps.exams.models import Exam, ExamReminder
    from apps.notifications.models import Notification
    from .email_service import EmailService
    from .sms_service import SMSService
    from .push_service import PushService

    now = timezone.now()

    reminders = ExamReminder.objects.filter(
        is_active=True
    ).select_related('exam', 'user')

    for reminder in reminders:
        exam = reminder.exam
        remind_at = timezone.make_aware(
            timezone.datetime.combine(exam.date, exam.time or timezone.datetime.min.time())
        ) - timedelta(minutes=reminder.remind_before_minutes)

        if now >= remind_at and (not reminder.last_reminded or reminder.last_reminded < remind_at):
            notification = Notification.objects.create(
                user=reminder.user,
                title=f"Exam Reminder: {exam.title}",
                message=f"Your {exam.get_exam_type_display()} for {exam.course.code} is on {exam.date}",
                notification_type='exam_reminder',
                channel='in_app',
                metadata={
                    'exam_id': str(exam.id),
                    'course_code': exam.course.code,
                    'exam_date': str(exam.date),
                }
            )

            for channel in reminder.channels:
                if channel == 'email' and reminder.user.email_notifications:
                    EmailService.send_exam_reminder(reminder.user, exam)
                elif channel == 'sms' and reminder.user.sms_notifications:
                    SMSService.send_exam_reminder(reminder.user, exam)
                elif channel == 'push' and reminder.user.push_notifications:
                    PushService.send_exam_reminder(reminder.user, exam)

            reminder.last_reminded = now
            reminder.save()

    return f"Processed {reminders.count()} exam reminders"


@shared_task
def send_quiz_reminders():
    from apps.exams.models import Quiz
    from apps.notifications.models import Notification
    from .email_service import EmailService
    from .push_service import PushService

    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)

    quizzes_today = Quiz.objects.filter(date=today, is_active=True)
    quizzes_tomorrow = Quiz.objects.filter(date=tomorrow, is_active=True)

    for quiz in quizzes_today:
        for enrollment in quiz.course.enrollments.all():
            notification = Notification.objects.create(
                user=enrollment.student,
                title=f"Quiz Today: {quiz.title}",
                message=f"Quiz for {quiz.course.code} is scheduled today at {quiz.time or 'TBD'}",
                notification_type='quiz_reminder',
                channel='in_app',
            )
            if enrollment.student.push_notifications:
                PushService.send_quiz_reminder(enrollment.student, quiz)

    for quiz in quizzes_tomorrow:
        for enrollment in quiz.course.enrollments.all():
            Notification.objects.create(
                user=enrollment.student,
                title=f"Quiz Tomorrow: {quiz.title}",
                message=f"Quiz for {quiz.course.code} is scheduled tomorrow at {quiz.time or 'TBD'}",
                notification_type='quiz_reminder',
                channel='in_app',
            )

    return f"Processed {quizzes_today.count() + quizzes_tomorrow.count()} quiz reminders"


@shared_task
def send_study_task_reminders():
    from apps.study_plans.models import StudyTask
    from apps.notifications.models import Notification
    from .push_service import PushService

    today = timezone.now().date()

    today_tasks = StudyTask.objects.filter(
        scheduled_date=today,
        status='pending'
    ).select_related('study_plan__student', 'study_plan__course')

    for task in today_tasks:
        student = task.study_plan.student
        notification = Notification.objects.create(
            user=student,
            title=f"Study Task: {task.topic}",
            message=f"Time to study {task.topic} for {task.study_plan.course.code}",
            notification_type='study_task',
            channel='in_app',
            metadata={
                'task_id': str(task.id),
                'plan_id': str(task.study_plan.id),
            }
        )

        if student.push_notifications:
            PushService.send_study_task_reminder(student, task)

    return f"Sent {today_tasks.count()} study task reminders"


@shared_task
def send_goal_deadline_reminders():
    from apps.goals.models import Goal
    from apps.notifications.models import Notification
    from .email_service import EmailService

    today = timezone.now().date()

    upcoming_goals = Goal.objects.filter(
        status='active',
        target_date__lte=today + timedelta(days=7),
        target_date__gte=today
    )

    for goal in upcoming_goals:
        days_left = (goal.target_date - today).days
        Notification.objects.create(
            user=goal.student,
            title=f"Goal Deadline: {goal.title}",
            message=f"Your goal '{goal.title}' is due in {days_left} days. Current progress: {goal.progress}%",
            notification_type='goal_deadline',
            channel='in_app',
            metadata={
                'goal_id': str(goal.id),
                'days_left': days_left,
            }
        )

        if goal.student.email_notifications:
            EmailService.send_goal_reminder(goal.student, goal)

    return f"Sent {upcoming_goals.count()} goal deadline reminders"


@shared_task
def send_weekly_progress_reports():
    from apps.courses.models import Enrollment
    from apps.study_plans.models import StudyPlan
    from apps.goals.models import Goal
    from .email_service import EmailService

    from django.contrib.auth import get_user_model
    User = get_user_model()

    students = User.objects.filter(role='student', email_notifications=True)

    for student in students:
        plans = StudyPlan.objects.filter(student=student, status='active')
        goals = Goal.objects.filter(student=student, status='active')

        total_tasks = sum(p.tasks.count() for p in plans)
        completed_tasks = sum(p.tasks.filter(status='completed').count() for p in plans)

        progress_data = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
            'active_plans': plans.count(),
            'active_goals': goals.count(),
            'goal_progress': [
                {'title': g.title, 'progress': float(g.progress)}
                for g in goals[:5]
            ]
        }

        EmailService.send_weekly_report(student, progress_data)

    return f"Sent weekly reports to {students.count()} students"


@shared_task
def cleanup_old_notifications():
    from apps.notifications.models import Notification

    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_read=True
    ).delete()[0]

    return f"Cleaned up {deleted_count} old notifications"
