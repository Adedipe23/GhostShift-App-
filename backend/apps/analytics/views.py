"""Analytics views — dashboard aggregation endpoint."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.attendance.models import TimeEntry, TimeEntryStatus
from apps.burnout.models import BurnoutScore
from apps.departments.models import Department
from apps.notifications.models import Notification
from apps.shifts.models import Shift
from apps.swaps.models import SwapRequest

User = get_user_model()


class DashboardView(APIView):
    """GET /api/analytics/dashboard/ — aggregated platform statistics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        user = request.user

        # ── Common stats ──────────────────────────────────────────────────
        total_employees = User.objects.filter(is_active=True, role="EMPLOYEE").count()
        total_departments = Department.objects.count()

        shifts_this_week = Shift.objects.filter(
            start_time__gte=week_start, start_time__lt=week_end
        )
        open_shifts = shifts_this_week.filter(status="OPEN").count()
        total_shifts_week = shifts_this_week.count()

        pending_swaps = SwapRequest.objects.filter(status="PENDING").count()

        # ── Burnout stats ──────────────────────────────────────────────────
        latest_scores = BurnoutScore.objects.filter(
            calculated_at__gte=now - timedelta(days=7)
        )
        avg_burnout = latest_scores.aggregate(avg=Avg("score"))["avg"] or 0
        high_risk_count = latest_scores.filter(risk_level__in=["HIGH", "CRITICAL"]).count()

        # ── Department workload ────────────────────────────────────────────
        dept_workload = list(
            shifts_this_week.values("department__name")
            .annotate(shift_count=Count("id"))
            .order_by("-shift_count")[:10]
        )

        # ── Unread notifications (current user) ───────────────────────────
        unread_notifications = Notification.objects.filter(
            user=user, read=False
        ).count()

        # ── Attendance stats ──────────────────────────────────────────────
        no_show_count = TimeEntry.objects.filter(status=TimeEntryStatus.NO_SHOW).count()
        early_checkout_count = TimeEntry.objects.filter(
            status__in=[TimeEntryStatus.EARLY_CHECKOUT_PENDING, TimeEntryStatus.EARLY_CHECKOUT]
        ).count()
        avg_worked_hours = TimeEntry.objects.filter(status=TimeEntryStatus.CLOCKED_OUT).aggregate(
            avg_hours=Avg("total_worked_hours")
        )["avg_hours"] or 0

        # ── Role-specific extras ───────────────────────────────────────────
        extra = {}
        if user.role == "EMPLOYEE":
            my_shifts = Shift.objects.filter(
                assigned_employee=user,
                start_time__gte=week_start,
                start_time__lt=week_end,
            )
            my_hours = sum(
                (s.end_time - s.start_time).total_seconds() / 3600 for s in my_shifts
            )
            my_score = (
                BurnoutScore.objects.filter(employee=user)
                .order_by("-calculated_at")
                .first()
            )
            extra = {
                "my_shifts_this_week": my_shifts.count(),
                "my_hours_this_week": round(my_hours, 1),
                "my_burnout_score": my_score.score if my_score else None,
                "my_burnout_risk": my_score.risk_level if my_score else None,
            }

        return Response(
            {
                "total_employees": total_employees,
                "total_departments": total_departments,
                "shifts_this_week": total_shifts_week,
                "open_shifts": open_shifts,
                "pending_swaps": pending_swaps,
                "avg_burnout_score": round(avg_burnout, 1),
                "high_risk_employees": high_risk_count,
                "department_workload": dept_workload,
                "unread_notifications": unread_notifications,
                "no_shows": no_show_count,
                "early_checkouts": early_checkout_count,
                "avg_worked_hours": round(avg_worked_hours, 1),
                **extra,
            }
        )
