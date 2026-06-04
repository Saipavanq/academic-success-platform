from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date, timedelta
from apps.courses.models import Enrollment, Course
from apps.exams.models import Exam, Quiz
from apps.study_plans.models import StudyPlan
from apps.goals.models import Goal


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    user = request.user
    today = date.today()

    enrolled_courses = Enrollment.objects.filter(student=user).select_related('course')
    enrolled_course_ids = enrolled_courses.values_list('course_id', flat=True)

    upcoming_exams = list(Exam.objects.filter(
        course_id__in=enrolled_course_ids,
        date__gte=today
    ).order_by('date')[:5])

    upcoming_quizzes = list(Quiz.objects.filter(
        course_id__in=enrolled_course_ids,
        date__gte=today,
        is_active=True
    ).order_by('date')[:5])

    active_plans = StudyPlan.objects.filter(
        student=user,
        status='active'
    ).select_related('course', 'exam')

    all_active_goals = Goal.objects.filter(
        student=user,
        status='active'
    ).order_by('target_date')
    active_goals_list = list(all_active_goals[:5])

    today_tasks = []
    for plan in active_plans:
        tasks = plan.tasks.filter(scheduled_date=today, status__in=['pending', 'in_progress'])
        today_tasks.extend([
            {
                'id': str(task.id),
                'topic': task.topic,
                'duration_minutes': task.duration_minutes,
                'status': task.status,
                'priority': task.priority,
                'plan_title': plan.title,
                'course_code': plan.course.code,
            }
            for task in tasks
        ])

    overdue_goals_count = Goal.objects.filter(
        student=user,
        status='active',
        target_date__lt=today
    ).count()

    return Response({
        'enrolled_courses': [
            {
                'id': str(e.course.id),
                'name': e.course.name,
                'code': e.course.code,
            }
            for e in enrolled_courses
        ],
        'upcoming_exams': [
            {
                'id': str(exam.id),
                'title': exam.title,
                'exam_type': exam.exam_type,
                'date': exam.date,
                'days_until': max((exam.date - today).days, 0),
                'course_code': exam.course.code,
                'total_marks': exam.total_marks,
            }
            for exam in upcoming_exams
        ],
        'upcoming_quizzes': [
            {
                'id': str(quiz.id),
                'title': quiz.title,
                'date': quiz.date,
                'days_until': max((quiz.date - today).days, 0),
                'course_code': quiz.course.code,
                'total_marks': quiz.total_marks,
            }
            for quiz in upcoming_quizzes
        ],
        'active_plans_count': active_plans.count(),
        'active_goals': [
            {
                'id': str(goal.id),
                'title': goal.title,
                'target_date': goal.target_date,
                'progress': float(goal.progress),
                'days_until': max((goal.target_date - today).days, 0),
            }
            for goal in active_goals_list
        ],
        'today_tasks': today_tasks,
        'overdue_goals_count': overdue_goals_count,
        'stats': {
            'total_courses': enrolled_courses.count(),
            'total_upcoming_exams': Exam.objects.filter(
                course_id__in=enrolled_course_ids, date__gte=today
            ).count(),
            'total_active_plans': active_plans.count(),
            'total_active_goals': all_active_goals.count(),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def faculty_dashboard(request):
    user = request.user
    today = date.today()

    taught_courses = Course.objects.filter(faculty=user)

    upcoming_exams = Exam.objects.filter(
        course__in=taught_courses,
        date__gte=today
    ).order_by('date')[:10]

    total_students = Enrollment.objects.filter(
        course__in=taught_courses
    ).values('student').distinct().count()

    return Response({
        'taught_courses': [
            {
                'id': str(course.id),
                'name': course.name,
                'code': course.code,
                'enrollment_count': course.enrollments.count(),
            }
            for course in taught_courses
        ],
        'upcoming_exams': [
            {
                'id': str(exam.id),
                'title': exam.title,
                'date': exam.date,
                'course_code': exam.course.code,
                'days_until': max((exam.date - today).days, 0),
            }
            for exam in upcoming_exams
        ],
        'total_students': total_students,
        'stats': {
            'total_courses': taught_courses.count(),
            'total_exams': Exam.objects.filter(course__in=taught_courses).count(),
            'total_students': total_students,
        }
    })
