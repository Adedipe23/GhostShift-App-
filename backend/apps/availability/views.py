from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .filters import AvailabilityFilter
from .models import Availability
from .serializers import AvailabilitySerializer


class AvailabilityViewSet(viewsets.ModelViewSet):
    """Availability CRUD. Employees see only their own; managers see all."""

    serializer_class = AvailabilitySerializer
    filterset_class = AvailabilityFilter
    ordering_fields = ["date"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "EMPLOYEE":
            return Availability.objects.filter(employee=user)
        return Availability.objects.select_related("employee").all()

    def perform_create(self, serializer):
        # Employees can only set their own availability
        user = self.request.user
        if user.role == "EMPLOYEE":
            serializer.save(employee=user)
        else:
            serializer.save()
