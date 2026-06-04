from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.StudyPlanViewSet, basename='study_plan')
router.register('tasks', views.StudyTaskViewSet, basename='study_task')

urlpatterns = [
    path('generate/', views.generate_study_plan, name='generate_study_plan'),
    path('', include(router.urls)),
]
