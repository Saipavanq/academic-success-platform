from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .models import StudyPlan, StudyTask, StudySession
from .serializers import (
    StudyPlanSerializer, StudyPlanCreateSerializer,
    StudyTaskSerializer, StudySessionSerializer
)


class StudyPlanViewSet(viewsets.ModelViewSet):
    serializer_class = StudyPlanSerializer

    def get_queryset(self):
        return StudyPlan.objects.filter(student=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return StudyPlanCreateSerializer
        return StudyPlanSerializer

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        plan = self.get_object()
        tasks = plan.tasks.all()
        total = tasks.count()
        completed = tasks.filter(status='completed').count()
        in_progress = tasks.filter(status='in_progress').count()
        pending = tasks.filter(status='pending').count()

        return Response({
            'total_tasks': total,
            'completed': completed,
            'in_progress': in_progress,
            'pending': pending,
            'progress_percentage': plan.progress_percentage,
            'total_hours': plan.total_hours,
        })

    @action(detail=True, methods=['post'])
    def complete_task(self, request, pk=None):
        plan = self.get_object()
        task_id = request.data.get('task_id')
        try:
            task = plan.tasks.get(id=task_id)
            task.status = 'completed'
            task.completed_at = datetime.now()
            task.save()
            return Response(StudyTaskSerializer(task).data)
        except StudyTask.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)


class StudyTaskViewSet(viewsets.ModelViewSet):
    serializer_class = StudyTaskSerializer

    def get_queryset(self):
        return StudyTask.objects.filter(study_plan__student=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        task = self.get_object()
        task.status = 'in_progress'
        task.save()
        session = StudySession.objects.create(
            task=task,
            student=request.user,
            start_time=datetime.now()
        )
        return Response(StudySessionSerializer(session).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = datetime.now()
        task.save()

        active_session = task.sessions.filter(end_time__isnull=True).first()
        if active_session:
            active_session.end_time = datetime.now()
            active_session.duration_minutes = (active_session.end_time - active_session.start_time).seconds // 60
            active_session.save()

        return Response(StudyTaskSerializer(task).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_study_plan(request):
    try:
        from ai.study_planner import StudyPlanGenerator
        generator = StudyPlanGenerator()
        plan_data = generator.generate(
            student=request.user,
            exam_id=request.data.get('exam_id'),
            available_hours_per_day=request.data.get('hours_per_day', 3),
            preferred_start_time=request.data.get('start_time', '09:00')
        )
    except ImportError:
        return Response({
            'error': 'AI module not installed. Please install required packages.'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
    return Response(plan_data, status=status.HTTP_201_CREATED)
