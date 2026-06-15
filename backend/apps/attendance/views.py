from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsManagerOrAbove

from .models import TimeEntry
from .serializers import EmergencyCheckoutRequestSerializer, TimeEntrySerializer
from .services import AttendanceService


class TimeEntryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "EMPLOYEE":
            return TimeEntry.objects.filter(employee=user)
        return TimeEntry.objects.all()

    @action(detail=False, methods=["post"])
    def clock_in(self, request):
        shift_id = request.data.get("shift_id")
        entry = AttendanceService.clock_in(request.user, shift_id)
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=["post"])
    def clock_out(self, request):
        shift_id = request.data.get("shift_id")
        entry = AttendanceService.clock_out(request.user, shift_id)
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=["post"])
    def emergency_checkout(self, request):
        serializer = EmergencyCheckoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        entry = AttendanceService.emergency_checkout(
            request.user, data["shift_id"], data["incident_type"], data["description"]
        )
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=True, methods=["post"], permission_classes=[IsManagerOrAbove])
    def approve_early_checkout(self, request, pk=None):
        entry = AttendanceService.approve_emergency_checkout(request.user, pk)
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=True, methods=["post"], permission_classes=[IsManagerOrAbove])
    def reject_early_checkout(self, request, pk=None):
        entry = AttendanceService.reject_emergency_checkout(request.user, pk)
        return Response(TimeEntrySerializer(entry).data)
