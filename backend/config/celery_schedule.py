from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'send-exam-reminders': {
        'task': 'notifications_service.tasks.send_exam_reminders',
        'schedule': crontab(hour='8', minute='0'),
    },
    'send-quiz-reminders': {
        'task': 'notifications_service.tasks.send_quiz_reminders',
        'schedule': crontab(hour='7', minute='0'),
    },
    'send-study-task-reminders': {
        'task': 'notifications_service.tasks.send_study_task_reminders',
        'schedule': crontab(hour='8', minute='30'),
    },
    'send-goal-deadline-reminders': {
        'task': 'notifications_service.tasks.send_goal_deadline_reminders',
        'schedule': crontab(hour='9', minute='0'),
    },
    'send-weekly-progress-reports': {
        'task': 'notifications_service.tasks.send_weekly_progress_reports',
        'schedule': crontab(hour='10', minute='0', day_of_week='sunday'),
    },
    'cleanup-old-notifications': {
        'task': 'notifications_service.tasks.cleanup_old_notifications',
        'schedule': crontab(hour='3', minute='0', day_of_week='sunday'),
    },
}
