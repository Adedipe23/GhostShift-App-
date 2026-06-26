from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor_display",
            "actor_email",
            "action",
            "category",
            "status",
            "method",
            "path",
            "ip_address",
            "response_status",
            "extra",
            "timestamp",
        ]

    def get_actor_display(self, obj) -> str:
        if obj.actor:
            name = obj.actor.full_name
            if name.strip():
                return name
        return obj.actor_email or "System"
