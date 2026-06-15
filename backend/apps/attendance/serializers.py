from rest_framework import serializers

from .models import ShiftIncident, TimeEntry


class TimeEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.first_name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)
    shift_title = serializers.CharField(source="shift.title", read_only=True)

    class Meta:
        model = TimeEntry
        fields = "__all__"
        read_only_fields = ["id", "employee", "clock_in_time", "clock_out_time", "status", "total_worked_hours", "created_at", "updated_at"]

class ShiftIncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftIncident
        fields = "__all__"
        read_only_fields = ["id", "employee", "reported_at"]

class EmergencyCheckoutRequestSerializer(serializers.Serializer):
    shift_id = serializers.UUIDField()
    incident_type = serializers.CharField()
    description = serializers.CharField()
