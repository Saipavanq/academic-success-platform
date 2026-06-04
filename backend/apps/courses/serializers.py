from rest_framework import serializers
from .models import Course, Enrollment, Syllabus


class CourseSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'description', 'faculty', 'faculty_name',
                  'semester', 'department', 'credits', 'enrollment_count',
                  'is_enrolled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_enrollment_count(self, obj):
        return obj.enrollments.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_code', 'enrolled_at']
        read_only_fields = ['id', 'enrolled_at']


class SyllabusSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = Syllabus
        fields = ['id', 'course', 'course_code', 'file', 'uploaded_by',
                  'uploaded_by_name', 'parsed_data', 'is_parsed', 'uploaded_at']
        read_only_fields = ['id', 'parsed_data', 'is_parsed', 'uploaded_at']


class SyllabusUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Syllabus
        fields = ['id', 'course', 'file']
