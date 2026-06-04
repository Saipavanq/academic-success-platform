from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['put'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['put'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    user = request.user
    user.email_notifications = request.data.get('email_notifications', user.email_notifications)
    user.sms_notifications = request.data.get('sms_notifications', user.sms_notifications)
    user.push_notifications = request.data.get('push_notifications', user.push_notifications)
    user.in_app_notifications = request.data.get('in_app_notifications', user.in_app_notifications)
    user.save()
    return Response({'message': 'Preferences updated'})
