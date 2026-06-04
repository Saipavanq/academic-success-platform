from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from .models import Goal, GoalMilestone
from .serializers import GoalSerializer, GoalMilestoneSerializer


class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        goal = self.get_object()
        progress = request.data.get('progress', 0)
        goal.progress = min(progress, 100)
        if goal.progress >= 100:
            goal.status = 'achieved'
        goal.save()
        return Response(GoalSerializer(goal).data)

    @action(detail=True, methods=['post'])
    def complete_milestone(self, request, pk=None):
        goal = self.get_object()
        milestone_id = request.data.get('milestone_id')
        try:
            milestone = goal.milestone_list.get(id=milestone_id)
            milestone.is_completed = True
            milestone.completed_at = datetime.now()
            milestone.save()
            return Response(GoalMilestoneSerializer(milestone).data)
        except GoalMilestone.DoesNotExist:
            return Response({'error': 'Milestone not found'}, status=status.HTTP_404_NOT_FOUND)


class GoalMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = GoalMilestoneSerializer

    def get_queryset(self):
        return GoalMilestone.objects.filter(goal__student=self.request.user)
