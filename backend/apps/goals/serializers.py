from rest_framework import serializers
from .models import Goal, GoalMilestone


class GoalMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalMilestone
        fields = ['id', 'goal', 'title', 'target_date', 'is_completed', 'completed_at', 'notes']
        read_only_fields = ['id', 'completed_at']


class GoalSerializer(serializers.ModelSerializer):
    milestones = GoalMilestoneSerializer(many=True, read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    days_until = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = ['id', 'student', 'title', 'description', 'goal_type', 'course',
                  'course_code', 'target_marks', 'target_percentage', 'target_date',
                  'status', 'progress', 'milestones', 'days_until',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'student', 'created_at', 'updated_at']

    def get_days_until(self, obj):
        from datetime import date
        delta = obj.target_date - date.today()
        return max(delta.days, 0)
