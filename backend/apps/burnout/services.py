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
    def calculate_score_locally(metrics: dict) -> dict:
        """
        Calculate burnout risk score from weekly metrics locally in Django.
        """
        factors = {}
        recommendations = []

        weekly_hours = metrics.get("weekly_hours", 0.0)
        consecutive_shifts = metrics.get("consecutive_shifts", 0)
        night_shifts = metrics.get("night_shifts", 0)
        rest_hours = metrics.get("rest_hours", 8.0)

        # Weekly hours
        if weekly_hours > 60:
            factors["weekly_hours"] = 30
            recommendations.append("Critical: Weekly hours exceed 60. Immediate schedule reduction required.")
        elif weekly_hours > 50:
            factors["weekly_hours"] = 20
            recommendations.append("Weekly hours above 50. Consider redistributing shifts across the team.")
        else:
            factors["weekly_hours"] = 0

        # Consecutive shifts
        if consecutive_shifts > 7:
            factors["consecutive_shifts"] = 30
            recommendations.append("Critical: Over 7 consecutive shifts. Mandatory rest days must be scheduled immediately.")
        elif consecutive_shifts > 5:
            factors["consecutive_shifts"] = 20
            recommendations.append("More than 5 consecutive shifts detected. Schedule a rest day within the next 2 days.")
        else:
            factors["consecutive_shifts"] = 0

        # Night shifts
        if night_shifts > 5:
            factors["night_shifts"] = 25
            recommendations.append("Critical: Excessive night shifts (>5). Rotate to day shifts to restore circadian rhythm.")
        elif night_shifts > 3:
            factors["night_shifts"] = 15
            recommendations.append("Night shift count above recommended limit. Limit to 3 night shifts per week.")
        else:
            factors["night_shifts"] = 0

        # Rest hours
        if rest_hours < 6:
            factors["rest_hours"] = 35
            recommendations.append("Critical: Minimum rest period below 6 hours. This violates safe work standards.")
        elif rest_hours < 8:
            factors["rest_hours"] = 25
            recommendations.append("Rest period below recommended 8 hours. Adjust scheduling to ensure adequate recovery time.")
        else:
            factors["rest_hours"] = 0

        raw_score = sum(factors.values())
        score = max(0, min(100, raw_score))

        if score == 0:
            recommendations.append("Excellent workload balance! Current scheduling practices are within healthy guidelines.")

        # Determine risk level
        if score <= 25:
            risk_level = "LOW"
        elif score <= 50:
            risk_level = "MEDIUM"
        elif score <= 75:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        return {
            "score": score,
            "risk_level": risk_level,
            "factors": factors,
            "recommendations": recommendations,
        }

    @classmethod
    def calculate_for_employee(cls, employee):
        """Full pipeline: compute metrics → compute score locally → persist BurnoutScore."""
        from apps.burnout.models import BurnoutScore

        metrics = cls.get_weekly_metrics(employee)
        result = cls.calculate_score_locally(metrics)

        return BurnoutScore.objects.create(
            employee=employee,
            score=result.get("score", 0),
            risk_level=result.get("risk_level", "LOW"),
            **metrics,
        )
