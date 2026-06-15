from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsManagerOrAbove

from .filters import ShiftFilter
from .models import Shift
from .serializers import ShiftSerializer, ShiftWriteSerializer
from .services import ShiftService


class ShiftViewSet(viewsets.ModelViewSet):
    """
    Shift CRUD.

    - GET  /api/shifts/         — list (all authenticated users)
    - POST /api/shifts/         — create (manager+)
    - PUT  /api/shifts/{id}/    — update (manager+)
    - DELETE /api/shifts/{id}/  — delete (manager+)
    """

    queryset = Shift.objects.select_related(
        "department", "assigned_employee", "created_by"
    ).all()
    filterset_class = ShiftFilter
    search_fields = ["title", "department__name", "assigned_employee__email"]
    ordering_fields = ["start_time", "end_time", "status"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ShiftWriteSerializer
        return ShiftSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Employees only see their own shifts
        if user.role == "EMPLOYEE":
            qs = qs.filter(assigned_employee=user)
        return qs

    def perform_create(self, serializer):
        employee = serializer.validated_data.get("assigned_employee")
        department = serializer.validated_data.get("department")
        if employee:
            ShiftService.validate_all(
                employee,
                serializer.validated_data["start_time"],
                serializer.validated_data["end_time"],
                shift_department=department,
            )
            from apps.notifications.tasks import send_notification_task
            send_notification_task(
                employee.id,
                "New Shift Assigned",
                f"You have been assigned to a new shift starting at {serializer.validated_data['start_time'].strftime('%b %d, %H:%M')}."
            )
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        employee = serializer.validated_data.get(
            "assigned_employee", serializer.instance.assigned_employee
        )
        department = serializer.validated_data.get("department", serializer.instance.department)
        
        old_employee = serializer.instance.assigned_employee
        
        if employee:
            ShiftService.validate_all(
                employee,
                serializer.validated_data.get("start_time", serializer.instance.start_time),
                serializer.validated_data.get("end_time", serializer.instance.end_time),
                shift_department=department,
                exclude_id=serializer.instance.id,
            )
            
            if old_employee != employee:
                from apps.notifications.tasks import send_notification_task
                start = serializer.validated_data.get("start_time", serializer.instance.start_time)
                send_notification_task(
                    employee.id,
                    "New Shift Assigned",
                    f"You have been assigned to a shift starting at {start.strftime('%b %d, %H:%M')}."
                )
        serializer.save()
