"""Availability serializers."""

from rest_framework import serializers

from .models import Availability


class AvailabilitySerializer(serializers.ModelSerializer):
    employee_email = serializers.EmailField(source="employee.email", read_only=True)

    class Meta:
        model = Availability
        fields = ["id", "employee", "employee_email", "date", "available", "note", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"employee": {"required": False}}
