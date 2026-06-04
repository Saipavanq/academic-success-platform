from django.db import models
from django.conf import settings
from apps.courses.models import Course
import uuid


class Goal(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ACHIEVED = 'achieved', 'Achieved'
        MISSED = 'missed', 'Missed'
        PAUSED = 'paused', 'Paused'

    class GoalType(models.TextChoices):
        EXAM_SCORE = 'exam_score', 'Exam Score'
        GPA = 'gpa', 'GPA'
        STUDY_HOURS = 'study_hours', 'Study Hours'
        COMPLETION = 'completion', 'Course Completion'
        CUSTOM = 'custom', 'Custom'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='goals'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    goal_type = models.CharField(max_length=20, choices=GoalType.choices, default=GoalType.CUSTOM)
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='goals'
    )
    target_marks = models.PositiveIntegerField(null=True, blank=True)
    target_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    target_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    milestones = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Goal: {self.title}"


class GoalMilestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='milestone_list')
    title = models.CharField(max_length=200)
    target_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['target_date']

    def __str__(self):
        return f"Milestone: {self.title}"
