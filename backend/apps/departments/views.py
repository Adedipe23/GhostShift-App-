from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsManagerOrAbove

from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD for departments. Create/update/delete requires MANAGER or above."""

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]
