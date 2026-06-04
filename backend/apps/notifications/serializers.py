from rest_framework import serializers
from .models import Notification, NotificationBatch


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type',
                  'channel', 'is_read', 'is_sent', 'scheduled_at', 'sent_at',
                  'metadata', 'created_at']
        read_only_fields = ['id', 'is_sent', 'sent_at', 'created_at']


class NotificationBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationBatch
        fields = ['id', 'notifications', 'created_at', 'sent_at', 'status']
        read_only_fields = ['id', 'created_at']
