from rest_framework import serializers

from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ["id", "name", "description", "member_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()
