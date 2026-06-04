import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('academic_success')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Load periodic tasks from schedule config
app.conf.beat_schedule = {
    'send-exam-reminders': {
        'task': 'notifications_service.tasks.send_exam_reminders',
        'schedule': 86400.0,  # Daily
    },
    'send-quiz-reminders': {
        'task': 'notifications_service.tasks.send_quiz_reminders',
        'schedule': 86400.0,
    },
    'send-study-task-reminders': {
        'task': 'notifications_service.tasks.send_study_task_reminders',
        'schedule': 86400.0,
    },
    'send-goal-deadline-reminders': {
        'task': 'notifications_service.tasks.send_goal_deadline_reminders',
        'schedule': 86400.0,
    },
    'send-weekly-progress-reports': {
        'task': 'notifications_service.tasks.send_weekly_progress_reports',
        'schedule': 604800.0,  # Weekly
    },
    'cleanup-old-notifications': {
        'task': 'notifications_service.tasks.cleanup_old_notifications',
        'schedule': 604800.0,
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
