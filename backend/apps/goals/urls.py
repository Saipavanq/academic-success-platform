from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.GoalViewSet, basename='goal')
router.register('milestones', views.GoalMilestoneViewSet, basename='goal_milestone')

urlpatterns = [
    path('', include(router.urls)),
]
