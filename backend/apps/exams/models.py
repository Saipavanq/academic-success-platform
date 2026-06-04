from django.db import models
from django.conf import settings
from apps.courses.models import Course
import uuid


class Exam(models.Model):
    class ExamType(models.TextChoices):
        MIDTERM = 'midterm', 'Midterm'
        FINAL = 'final', 'Final'
        QUIZ = 'quiz', 'Quiz'
        ASSIGNMENT = 'assignment', 'Assignment'
        VIVA = 'viva', 'Viva'
        PRACTICAL = 'practical', 'Practical'

    class Priority(models.TextChoices):
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    title = models.CharField(max_length=200)
    exam_type = models.CharField(max_length=20, choices=ExamType.choices)
    description = models.TextField(blank=True)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    total_marks = models.PositiveIntegerField(default=100)
    passing_marks = models.PositiveIntegerField(default=40)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    location = models.CharField(max_length=200, blank=True)
    building = models.CharField(max_length=100, blank=True, help_text='Building name / block')
    room_number = models.CharField(max_length=50, blank=True, help_text='Room number or hall name')
    seat_number = models.CharField(max_length=100, blank=True, help_text='Assigned seat or roll number range')
    instructions = models.TextField(blank=True, help_text='What to bring, dress code, etc.')
    syllabus_topics = models.JSONField(default=list, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.title} ({self.get_exam_type_display()}) - {self.date}"


class Quiz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    total_marks = models.PositiveIntegerField(default=20)
    topics = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time']
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return f"Quiz: {self.title} - {self.date}"


class ExamReminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='exam_reminders'
    )
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='reminders')
    remind_before_minutes = models.PositiveIntegerField(default=1440)  # 1 day
    channels = models.JSONField(default=list)  # ["email", "sms", "push"]
    is_active = models.BooleanField(default=True)
    last_reminded = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reminder for {self.user.get_full_name()} - {self.exam.title}"
