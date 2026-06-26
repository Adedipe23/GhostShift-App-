from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import BurnoutScore


class BurnoutScoreSerializer(serializers.ModelSerializer):
    employee_detail = UserSerializer(source="employee", read_only=True)

    class Meta:
        model = BurnoutScore
        fields = [
            "id", "employee", "employee_detail", "score", "risk_level",
            "weekly_hours", "consecutive_shifts", "night_shifts", "rest_hours",
            "calculated_at",
        ]
        read_only_fields = ["id", "calculated_at"]


class BurnoutCalculateSerializer(serializers.Serializer):
    """Request body for triggering burnout calculation."""
    employee_id = serializers.UUIDField(required=False, help_text="Specific employee ID; omit for self")
