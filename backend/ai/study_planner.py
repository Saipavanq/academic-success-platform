from datetime import datetime, timedelta, date
from collections import defaultdict
import math


class StudyPlanGenerator:
    def generate(self, student, exam_id, available_hours_per_day=3, preferred_start_time='09:00'):
        from apps.exams.models import Exam
        from apps.study_plans.models import StudyPlan, StudyTask

        exam = Exam.objects.get(id=exam_id)
        today = date.today()
        days_until_exam = (exam.date - today).days

        if days_until_exam <= 0:
            return {'error': 'Exam date has passed'}

        topics = exam.syllabus_topics or []
        if not topics:
            topics = [{'title': 'General Review', 'weightage': 100}]
        elif isinstance(topics[0], str):
            weight = 100 / len(topics)
            topics = [{'title': t, 'weightage': weight} for t in topics]

        total_hours_needed = self._calculate_total_hours(topics, exam.total_marks)
        total_available_hours = days_until_exam * available_hours_per_day

        if total_hours_needed > total_available_hours:
            study_days = math.ceil(total_hours_needed / available_hours_per_day)
            start_date = exam.date - timedelta(days=study_days)
            start_date = max(start_date, today)
        else:
            start_date = today

        plan = StudyPlan.objects.create(
            student=student,
            course=exam.course,
            exam=exam,
            title=f"Study Plan for {exam.title}",
            start_date=start_date,
            end_date=exam.date - timedelta(days=1),
            ai_generated=True,
        )

        tasks = self._distribute_topics(
            plan=plan,
            topics=topics,
            start_date=start_date,
            end_date=exam.date - timedelta(days=1),
            available_hours_per_day=available_hours_per_day,
            preferred_start_time=preferred_start_time,
            total_marks=exam.total_marks,
        )

        StudyTask.objects.bulk_create(tasks)

        return {
            'plan_id': str(plan.id),
            'title': plan.title,
            'start_date': str(plan.start_date),
            'end_date': str(plan.end_date),
            'total_tasks': len(tasks),
            'total_hours': sum(t.duration_minutes for t in tasks) / 60,
            'daily_schedule': self._generate_daily_summary(tasks),
        }

    def _calculate_total_hours(self, topics, total_marks):
        base_hours = 2
        marks_factor = total_marks / 100

        topic_hours = 0
        for topic in topics:
            weight = topic.get('weightage', 100 / len(topics))
            topic_hours += (weight / 100) * base_hours * marks_factor

        return topic_hours * 1.2

    def _distribute_topics(self, plan, topics, start_date, end_date,
                          available_hours_per_day, preferred_start_time, total_marks):
        tasks = []
        current_date = start_date
        topic_index = 0
        remaining_hours = available_hours_per_day

        sorted_topics = sorted(topics, key=lambda x: x.get('weightage', 50), reverse=True)

        hour, minute = map(int, preferred_start_time.split(':'))
        current_time = hour * 60 + minute

        for topic in sorted_topics:
            if current_date > end_date:
                break

            topic_name = topic.get('title', topic.get('name', 'Topic'))
            weight = topic.get('weightage', 100 / len(sorted_topics))
            difficulty = topic.get('difficulty', 'medium')

            duration = self._calculate_task_duration(weight, total_marks, difficulty)

            while duration > 0 and current_date <= end_date:
                session_duration = min(duration, remaining_hours * 60, 120)

                task_hours = session_duration // 60
                task_minutes = session_duration % 60

                task = self._create_task(
                    plan=plan,
                    topic=topic_name,
                    scheduled_date=current_date,
                    scheduled_time=f"{current_time // 60:02d}:{current_time % 60:02d}",
                    duration_minutes=session_duration,
                    weight=weight,
                    difficulty=difficulty,
                )
                tasks.append(task)

                current_time += session_duration
                duration -= session_duration
                remaining_hours -= session_duration / 60

                if remaining_hours <= 0 or current_time >= 22 * 60:
                    current_date += timedelta(days=1)
                    current_time = hour * 60 + minute
                    remaining_hours = available_hours_per_day

        return tasks

    def _calculate_task_duration(self, weight, total_marks, difficulty):
        base_duration = 30
        weight_factor = weight / 100
        marks_factor = total_marks / 100

        difficulty_multiplier = {
            'easy': 0.7,
            'medium': 1.0,
            'hard': 1.5,
        }

        duration = base_duration * weight_factor * marks_factor * difficulty_multiplier.get(difficulty, 1.0)
        return max(20, min(120, int(duration)))

    def _create_task(self, plan, topic, scheduled_date, scheduled_time,
                    duration_minutes, weight, difficulty):
        from apps.study_plans.models import StudyTask

        priority = 'high' if weight > 30 else ('medium' if weight > 15 else 'low')

        return StudyTask(
            study_plan=plan,
            topic=topic,
            description=f"Study {topic} (Weightage: {weight}%, Difficulty: {difficulty})",
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            duration_minutes=duration_minutes,
            priority=priority,
        )

    def _generate_daily_summary(self, tasks):
        daily = defaultdict(list)
        for task in tasks:
            daily[str(task.scheduled_date)].append({
                'topic': task.topic,
                'time': task.scheduled_time,
                'duration_minutes': task.duration_minutes,
                'priority': task.priority,
            })
        return dict(daily)

    def create_review_schedule(self, plan, review_days_before=3):
        from apps.study_plans.models import StudyTask
        from apps.exams.models import Exam

        exam = plan.exam
        review_start = exam.date - timedelta(days=review_days_before)

        review_tasks = []
        completed_topics = plan.tasks.filter(
            status='completed'
        ).values_list('topic', flat=True).distinct()

        for topic in completed_topics:
            for day_offset in range(review_days_before):
                review_date = review_start + timedelta(days=day_offset)
                if review_date >= plan.start_date:
                    task = StudyTask(
                        study_plan=plan,
                        topic=f"Review: {topic}",
                        description=f"Review session for {topic}",
                        scheduled_date=review_date,
                        scheduled_time='10:00',
                        duration_minutes=30,
                        priority='high',
                    )
                    review_tasks.append(task)

        StudyTask.objects.bulk_create(review_tasks)
        return review_tasks
