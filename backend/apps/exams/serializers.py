from rest_framework import serializers
from django.db import transaction
from .models import Exam, Quiz, ExamReminder


class ExamSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    days_until = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ['id', 'course', 'course_code', 'course_name', 'title', 'exam_type', 'exam_type_display',
                  'description', 'date', 'time', 'duration_minutes', 'total_marks',
                  'passing_marks', 'weightage', 'location', 'building', 'room_number',
                  'seat_number', 'instructions', 'syllabus_topics',
                  'priority', 'created_by', 'days_until', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_days_until(self, obj):
        from datetime import date
        delta = obj.date - date.today()
        return max(delta.days, 0)


class QuizSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    days_until = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'course', 'course_code', 'title', 'description',
                  'date', 'time', 'duration_minutes', 'total_marks',
                  'topics', 'is_active', 'days_until', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_days_until(self, obj):
        from datetime import date
        delta = obj.date - date.today()
        return max(delta.days, 0)


class ExamReminderSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = ExamReminder
        fields = ['id', 'user', 'exam', 'exam_title', 'remind_before_minutes',
                  'channels', 'is_active', 'last_reminded', 'created_at']
        read_only_fields = ['id', 'last_reminded', 'created_at']


class UpcomingExamSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'course_code', 'course_name', 'title', 'exam_type',
                  'date', 'time', 'duration_minutes', 'total_marks', 'priority',
                  'building', 'room_number']


class BatchImportExamSerializer(serializers.Serializer):
    course_code = serializers.CharField()
    title = serializers.CharField(max_length=200)
    exam_type = serializers.ChoiceField(choices=Exam.ExamType.choices)
    date = serializers.DateField()
    time = serializers.TimeField(allow_null=True, required=False)
    duration_minutes = serializers.IntegerField(default=60, required=False)
    total_marks = serializers.IntegerField(default=100, required=False)
    location = serializers.CharField(required=False, allow_blank=True)
    building = serializers.CharField(required=False, allow_blank=True)
    room_number = serializers.CharField(required=False, allow_blank=True)
    seat_number = serializers.CharField(required=False, allow_blank=True)
    instructions = serializers.CharField(required=False, allow_blank=True)
    syllabus_topics = serializers.ListField(child=serializers.CharField(), required=False, default=list)
