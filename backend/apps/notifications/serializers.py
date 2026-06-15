from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "user", "title", "message", "read", "notification_type", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
