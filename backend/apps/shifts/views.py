from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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

    @action(detail=False, methods=["post"], url_path="recommend-replacements")
    def recommend_replacements(self, request):
        """
        POST /api/shifts/recommend-replacements/
        Calculates ranked recommendations locally for testing.
        """
        candidates_data = request.data.get("candidates", [])
        ranked_list = []

        for cand in candidates_data:
            user_id = cand.get("user_id", "")
            is_available = cand.get("is_available", True)
            department_match = cand.get("department_match", True)
            burnout_score = cand.get("burnout_score", 0)
            weekly_hours = cand.get("weekly_hours", 0.0)
            fairness_shift_count = cand.get("fairness_shift_count", 0)

            if not is_available:
                continue

            score = 100
            reasons = []

            if department_match:
                score += 20
            else:
                score -= 10
                reasons.append("Cross-department")

            if burnout_score > 75:
                score -= 40
                reasons.append("High burnout risk")
            elif burnout_score < 25:
                score += 15

            if weekly_hours > 50:
                score -= 30
                reasons.append("Approaching overtime")

            if fairness_shift_count > 5:
                score -= fairness_shift_count * 2
            else:
                score += (5 - fairness_shift_count) * 2

            if score > 100:
                reasons.append("Excellent match")

            reason_str = ", ".join(reasons) if reasons else "Good candidate"

            ranked_list.append({
                "user_id": user_id,
                "score": score,
                "match_reason": reason_str
            })

        ranked_list.sort(key=lambda x: x["score"], reverse=True)
        return Response({"ranked_candidates": ranked_list})
