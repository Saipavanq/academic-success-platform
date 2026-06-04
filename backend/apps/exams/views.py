from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from datetime import date, timedelta
from .models import Exam, Quiz, ExamReminder
from .serializers import (
    ExamSerializer, QuizSerializer,
    ExamReminderSerializer, UpcomingExamSerializer,
    BatchImportExamSerializer
)
from apps.courses.models import Course


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated


class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['course', 'exam_type', 'date', 'priority']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            enrolled_course_ids = user.enrollments.values_list('course_id', flat=True)
            return Exam.objects.filter(course_id__in=enrolled_course_ids)
        return Exam.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = date.today()
        upcoming_exams = self.get_queryset().filter(date__gte=today)[:10]
        serializer = UpcomingExamSerializer(upcoming_exams, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_import(self, request):
        if not isinstance(request.data, list):
            return Response({'error': 'Expected a list of exams.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        enrolled_courses = {
            c.code: c for c in Course.objects.filter(enrollments__student=user)
        }
        created = []
        errors = []

        with transaction.atomic():
            for i, item in enumerate(request.data):
                serializer = BatchImportExamSerializer(data=item)
                if not serializer.is_valid():
                    errors.append({'index': i, 'errors': serializer.errors})
                    continue
                course_code = serializer.validated_data.pop('course_code')
                course = enrolled_courses.get(course_code)
                if not course:
                    errors.append({'index': i, 'errors': f'Course "{course_code}" not found in your enrollments.'})
                    continue
                try:
                    exam = Exam.objects.create(
                        course=course,
                        created_by=user,
                        **serializer.validated_data
                    )
                    created.append(ExamSerializer(exam).data)
                except Exception as e:
                    errors.append({'index': i, 'errors': str(e)})

        return Response({
            'created': created,
            'errors': errors,
            'total_created': len(created),
            'total_errors': len(errors),
        }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def set_reminder(self, request, pk=None):
        exam = self.get_object()
        serializer = ExamReminderSerializer(data={
            'user': request.user.id,
            'exam': exam.id,
            'remind_before_minutes': request.data.get('remind_before_minutes', 1440),
            'channels': request.data.get('channels', ['email', 'push'])
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['course', 'date', 'is_active']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            enrolled_course_ids = user.enrollments.values_list('course_id', flat=True)
            return Quiz.objects.filter(course_id__in=enrolled_course_ids, is_active=True)
        return Quiz.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = date.today()
        upcoming_quizzes = self.get_queryset().filter(date__gte=today)[:10]
        return Response(QuizSerializer(upcoming_quizzes, many=True).data)


class ExamReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ExamReminderSerializer

    def get_queryset(self):
        return ExamReminder.objects.filter(user=self.request.user)
