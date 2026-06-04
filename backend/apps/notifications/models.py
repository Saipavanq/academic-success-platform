from django.db import models
from django.conf import settings
import uuid


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        EXAM_REMINDER = 'exam_reminder', 'Exam Reminder'
        QUIZ_REMINDER = 'quiz_reminder', 'Quiz Reminder'
        STUDY_TASK = 'study_task', 'Study Task'
        GOAL_DEADLINE = 'goal_deadline', 'Goal Deadline'
        SYLLABUS_PARSED = 'syllabus_parsed', 'Syllabus Parsed'
        WEEKLY_PROGRESS = 'weekly_progress', 'Weekly Progress'
        GENERAL = 'general', 'General'

    class Channel(models.TextChoices):
        EMAIL = 'email', 'Email'
        SMS = 'sms', 'SMS'
        PUSH = 'push', 'Push'
        IN_APP = 'in_app', 'In-App'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )
    channel = models.CharField(
        max_length=20, choices=Channel.choices,
        default=Channel.IN_APP
    )
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.get_full_name()}"


class NotificationBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notifications = models.ManyToManyField(Notification, related_name='batches')
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='pending')

    def __str__(self):
        return f"Batch {self.id} - {self.status}"
