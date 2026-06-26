from rest_framework import serializers

from apps.departments.serializers import DepartmentSerializer
from apps.users.serializers import UserSerializer

from .models import Shift


class ShiftSerializer(serializers.ModelSerializer):
    assigned_employee_detail = UserSerializer(source="assigned_employee", read_only=True)
    department_detail = DepartmentSerializer(source="department", read_only=True)
    duration_hours = serializers.ReadOnlyField()

    class Meta:
        model = Shift
        fields = [
            "id",
            "title",
            "department",
            "department_detail",
            "start_time",
            "end_time",
            "duration_hours",
            "assigned_employee",
            "assigned_employee_detail",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class ShiftWriteSerializer(serializers.ModelSerializer):
    """Serializer for create/update — excludes nested read-only fields."""

    class Meta:
        model = Shift
        fields = [
            "id",
            "title",
            "department",
            "start_time",
            "end_time",
            "assigned_employee",
            "status",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        start = attrs.get("start_time")
        end = attrs.get("end_time")
        if start and end and end <= start:
            raise serializers.ValidationError("end_time must be after start_time.")
        return attrs
