from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('preferences/', views.update_preferences, name='notification_preferences'),
    path('', include(router.urls)),
]
