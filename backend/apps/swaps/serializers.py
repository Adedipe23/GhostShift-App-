from rest_framework import serializers

from apps.shifts.serializers import ShiftSerializer
from apps.users.serializers import UserSerializer

from .models import SwapRequest


class SwapRequestSerializer(serializers.ModelSerializer):
    requester_detail = UserSerializer(source="requester", read_only=True)
    replacement_detail = UserSerializer(source="replacement_employee", read_only=True)
    shift_detail = ShiftSerializer(source="shift", read_only=True)

    class Meta:
        model = SwapRequest
        fields = [
            "id",
            "requester",
            "requester_detail",
            "shift",
            "shift_detail",
            "replacement_employee",
            "replacement_detail",
            "status",
            "manager_comment",
            "reviewed_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "requester", "status", "reviewed_by", "created_at", "updated_at"]


class SwapApprovalSerializer(serializers.Serializer):
    """Used for approve/reject actions."""
    manager_comment = serializers.CharField(required=False, allow_blank=True)
