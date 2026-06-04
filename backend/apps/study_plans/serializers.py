from rest_framework import serializers
from .models import StudyPlan, StudyTask, StudySession


class StudyTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = ['id', 'study_plan', 'topic', 'description', 'scheduled_date',
                  'scheduled_time', 'duration_minutes', 'status', 'priority',
                  'completed_at', 'notes', 'created_at']
        read_only_fields = ['id', 'completed_at', 'created_at']


class StudySessionSerializer(serializers.ModelSerializer):
    task_topic = serializers.CharField(source='task.topic', read_only=True)

    class Meta:
        model = StudySession
        fields = ['id', 'task', 'task_topic', 'student', 'start_time',
                  'end_time', 'duration_minutes', 'notes']
        read_only_fields = ['id']


class StudyPlanSerializer(serializers.ModelSerializer):
    tasks = StudyTaskSerializer(many=True, read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    total_hours = serializers.ReadOnlyField()
    course_code = serializers.CharField(source='course.code', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = StudyPlan
        fields = ['id', 'student', 'course', 'course_code', 'exam', 'exam_title',
                  'title', 'start_date', 'end_date', 'status', 'ai_generated',
                  'notes', 'tasks', 'progress_percentage', 'total_hours',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudyPlanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyPlan
        fields = ['id', 'course', 'exam', 'title', 'start_date', 'end_date', 'notes']
        read_only_fields = ['id']
