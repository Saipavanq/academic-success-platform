from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Syllabus
from .serializers import SyllabusSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_syllabus(request):
    serializer = SyllabusSerializer(data=request.data)
    if serializer.is_valid():
        syllabus = serializer.save(uploaded_by=request.user)
        return Response(SyllabusSerializer(syllabus).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_syllabus(request, pk):
    try:
        syllabus = Syllabus.objects.get(pk=pk)
    except Syllabus.DoesNotExist:
        return Response({'error': 'Syllabus not found'}, status=404)

    try:
        from ai.syllabus_parser import SyllabusParser
        parser = SyllabusParser()
        parsed_data = parser.parse(syllabus.file.path)
    except ImportError:
        parsed_data = {
            'exams': [],
            'topics': [],
            'chapters': [],
            'message': 'AI module not installed. Basic mode.'
        }

    syllabus.parsed_data = parsed_data
    syllabus.is_parsed = True
    syllabus.save()

    return Response({
        'message': 'Syllabus parsed successfully',
        'parsed_data': parsed_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_parsed_syllabus(request, pk):
    try:
        syllabus = Syllabus.objects.get(pk=pk)
    except Syllabus.DoesNotExist:
        return Response({'error': 'Syllabus not found'}, status=404)

    return Response(SyllabusSerializer(syllabus).data)


urlpatterns = [
    path('upload/', upload_syllabus, name='syllabus_upload'),
    path('<uuid:pk>/parse/', parse_syllabus, name='syllabus_parse'),
    path('<uuid:pk>/parsed/', get_parsed_syllabus, name='syllabus_parsed'),
]
