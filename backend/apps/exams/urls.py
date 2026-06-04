from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.ExamViewSet, basename='exam')
router.register('quizzes', views.QuizViewSet, basename='quiz')
router.register('reminders', views.ExamReminderViewSet, basename='exam_reminder')

urlpatterns = [
    path('', include(router.urls)),
]
