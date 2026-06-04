from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Course, Enrollment, Syllabus
from .serializers import (
    CourseSerializer, EnrollmentSerializer,
    SyllabusSerializer, SyllabusUploadSerializer
)


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['semester', 'department', 'faculty']
    search_fields = ['name', 'code', 'description']

    def get_queryset(self):
        return Course.objects.all()

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student = request.user
        if Enrollment.objects.filter(student=student, course=course).exists():
            return Response({'error': 'Already enrolled'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment = Enrollment.objects.create(student=student, course=course)
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'])
    def unenroll(self, request, pk=None):
        course = self.get_object()
        enrollment = get_object_or_404(Enrollment, student=request.user, course=course)
        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def enrolled_students(self, request, pk=None):
        course = self.get_object()
        enrollments = Enrollment.objects.filter(course=course)
        return Response(EnrollmentSerializer(enrollments, many=True).data)


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            return Enrollment.objects.filter(student=user)
        return Enrollment.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course_with_syllabus(request):
    course_serializer = CourseSerializer(
        data={
            'name': request.data.get('name'),
            'code': request.data.get('code', request.data.get('name')[:10].upper()),
            'semester': request.data.get('semester', 'Current'),
            'department': request.data.get('department', 'General'),
            'description': '',
        },
        context={'request': request}
    )
    if not course_serializer.is_valid():
        return Response(course_serializer.errors, status=400)

    course = course_serializer.save()

    Enrollment.objects.create(student=request.user, course=course)

    syllabus_id = None
    syllabus_data = None
    if request.FILES.get('file'):
        syllabus = Syllabus.objects.create(
            course=course,
            file=request.FILES['file'],
            uploaded_by=request.user,
        )
        syllabus_id = str(syllabus.id)
        try:
            from ai.syllabus_parser import SyllabusParser
            parser = SyllabusParser()
            file_path = syllabus.file.path
            parsed_data = parser.parse(file_path)
            syllabus.parsed_data = parsed_data
            syllabus.is_parsed = True
            syllabus.save()
            syllabus_data = parsed_data

            if parsed_data.get('exams'):
                from datetime import datetime
                from apps.exams.models import Exam
                for exam_data in parsed_data['exams']:
                    date_str = exam_data.get('date', '')
                    exam_date = None
                    if date_str:
                        for fmt in ['%Y-%m-%d', '%B %d, %Y', '%B %d %Y', '%m/%d/%Y', '%d/%m/%Y']:
                            try:
                                exam_date = datetime.strptime(date_str, fmt).date()
                                break
                            except ValueError:
                                continue
                    exam = Exam.objects.create(
                        course=course,
                        title=exam_data.get('title', 'Exam'),
                        exam_type=exam_data.get('type', 'midterm'),
                        date=exam_date or datetime.now().date(),
                        total_marks=exam_data.get('total_marks', 100),
                        created_by=request.user,
                    )
                    if parsed_data.get('topics'):
                        exam.syllabus_topics = [t.get('title', t.get('topic', 'General')) for t in parsed_data['topics']]
                        exam.save()

                from ai.study_planner import StudyPlanGenerator
                from apps.exams.models import Exam as ExamModel
                created_exams = ExamModel.objects.filter(course=course)
                for exam in created_exams:
                    try:
                        generator = StudyPlanGenerator()
                        generator.generate(
                            student=request.user,
                            exam_id=str(exam.id),
                            available_hours_per_day=3,
                            preferred_start_time='09:00'
                        )
                    except Exception as plan_err:
                        syllabus_data['plan_error'] = str(plan_err)
        except Exception as e:
            syllabus_data = {'parse_error': str(e)}

    return Response({
        'course': course_serializer.data,
        'syllabus_id': syllabus_id,
        'syllabus_data': syllabus_data,
        'message': 'Course created successfully'
    }, status=201)
