import logging
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone

from apps.shifts.models import Shift

logger = logging.getLogger(__name__)


class BurnoutService:
    """Computes burnout metrics and calls the AI service for scoring."""

    @staticmethod
    def get_weekly_metrics(employee):
        """
        Compute shift metrics for the current week.

        Returns:
            dict with weekly_hours, consecutive_shifts, night_shifts, rest_hours
        """
        now = timezone.now()
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        shifts = Shift.objects.filter(
            assigned_employee=employee,
            start_time__gte=week_start,
            start_time__lt=week_end,
            status__in=("SCHEDULED", "COMPLETED"),
        ).order_by("start_time")

        # Weekly hours
        weekly_hours = sum(
            (s.end_time - s.start_time).total_seconds() / 3600 for s in shifts
        )

        # Consecutive shifts (days with at least one shift)
        shift_dates = sorted({s.start_time.date() for s in shifts})
        consecutive = 0
        max_consecutive = 0
        prev_date = None
        for d in shift_dates:
            if prev_date and (d - prev_date).days == 1:
                consecutive += 1
            else:
                consecutive = 1
            max_consecutive = max(max_consecutive, consecutive)
            prev_date = d

        # Night shifts (starting between 20:00 and 06:00)
        night_shifts = sum(
            1 for s in shifts if s.start_time.hour >= 20 or s.start_time.hour < 6
        )

        # Minimum rest hours between consecutive shifts
        rest_hours = 24.0
        sorted_shifts = sorted(shifts, key=lambda s: s.start_time)
        for i in range(1, len(sorted_shifts)):
            gap = (
                sorted_shifts[i].start_time - sorted_shifts[i - 1].end_time
            ).total_seconds() / 3600
            rest_hours = min(rest_hours, gap)

        return {
            "weekly_hours": round(weekly_hours, 2),
            "consecutive_shifts": max_consecutive,
            "night_shifts": night_shifts,
            "rest_hours": round(rest_hours, 2),
        }

    @staticmethod
    def call_ai_service(metrics: dict) -> dict:
        """POST metrics to the FastAPI AI microservice and return score + risk_level."""
        url = f"{settings.AI_SERVICE_URL}/calculate-burnout"
        try:
            response = requests.post(url, json=metrics, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.error("AI service request failed: %s", exc)
            # Fallback: return low risk if AI service is unreachable
            return {"score": 0, "risk_level": "LOW"}

    @classmethod
    def calculate_for_employee(cls, employee):
        """Full pipeline: compute metrics → call AI → persist BurnoutScore."""
        from apps.burnout.models import BurnoutScore

        metrics = cls.get_weekly_metrics(employee)
        ai_result = cls.call_ai_service(metrics)

        return BurnoutScore.objects.create(
            employee=employee,
            score=ai_result.get("score", 0),
            risk_level=ai_result.get("risk_level", "LOW"),
            **metrics,
        )
