from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.CourseViewSet, basename='course')
router.register('enrollments', views.EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('create-with-syllabus/', views.create_course_with_syllabus, name='course_create_with_syllabus'),
    path('', include(router.urls)),
]
