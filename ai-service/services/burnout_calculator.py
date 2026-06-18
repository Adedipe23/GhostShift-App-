"""Burnout risk calculation service.

Rule-based scoring engine with ML-ready architecture.
Each risk factor contributes a discrete point value; the total is
clamped to [0, 100] and mapped to a named risk level.
"""

from schemas.burnout import BurnoutInput, BurnoutOutput


class BurnoutCalculatorService:
    """Stateless service that computes burnout risk scores."""

    # ------------------------------------------------------------------ #
    # Risk-level thresholds
    # ------------------------------------------------------------------ #
    LOW_MAX = 25
    MEDIUM_MAX = 50
    HIGH_MAX = 75
    # > 75 → CRITICAL

    def calculate(self, data: BurnoutInput) -> BurnoutOutput:
        """
        Calculate a burnout risk score from shift metrics.

        Args:
            data: Validated BurnoutInput payload.

        Returns:
            BurnoutOutput with score, risk_level, factors breakdown,
            and human-readable recommendations.
        """
        factors: dict[str, int] = {}
        recommendations: list[str] = []

        # ── Weekly hours ──────────────────────────────────────────────────
        if data.weekly_hours > 60:
            factors["weekly_hours"] = 30
            recommendations.append(
                "Critical: Weekly hours exceed 60. Immediate schedule reduction required."
            )
        elif data.weekly_hours > 50:
            factors["weekly_hours"] = 20
            recommendations.append(
                "Weekly hours above 50. Consider redistributing shifts across the team."
            )
        else:
            factors["weekly_hours"] = 0

        # ── Consecutive shifts ────────────────────────────────────────────
        if data.consecutive_shifts > 7:
            factors["consecutive_shifts"] = 30
            recommendations.append(
                "Critical: Over 7 consecutive shifts. Mandatory rest days must be scheduled immediately."
            )
        elif data.consecutive_shifts > 5:
            factors["consecutive_shifts"] = 20
            recommendations.append(
                "More than 5 consecutive shifts detected. Schedule a rest day within the next 2 days."
            )
        else:
            factors["consecutive_shifts"] = 0

        # ── Night shifts ──────────────────────────────────────────────────
        if data.night_shifts > 5:
            factors["night_shifts"] = 25
            recommendations.append(
                "Critical: Excessive night shifts (>5). Rotate to day shifts to restore circadian rhythm."
            )
        elif data.night_shifts > 3:
            factors["night_shifts"] = 15
            recommendations.append(
                "Night shift count above recommended limit. Limit to 3 night shifts per week."
            )
        else:
            factors["night_shifts"] = 0

        # ── Rest hours ────────────────────────────────────────────────────
        if data.rest_hours < 6:
            factors["rest_hours"] = 35
            recommendations.append(
                "Critical: Minimum rest period below 6 hours. This violates safe work standards."
            )
        elif data.rest_hours < 8:
            factors["rest_hours"] = 25
            recommendations.append(
                "Rest period below recommended 8 hours. Adjust scheduling to ensure adequate recovery time."
            )
        else:
            factors["rest_hours"] = 0

        # ── Aggregate & clamp ─────────────────────────────────────────────
        raw_score = sum(factors.values())
        score = max(0, min(100, raw_score))

        # Add positive reinforcement if no risk factors triggered
        if score == 0:
            recommendations.append(
                "Excellent workload balance! Current scheduling practices are within healthy guidelines."
            )

        risk_level = self._determine_risk_level(score)

        return BurnoutOutput(
            score=score,
            risk_level=risk_level,
            factors=factors,
            recommendations=recommendations,
        )

    @staticmethod
    def _determine_risk_level(score: int) -> str:
        """Map numeric score to a named risk level."""
        if score <= BurnoutCalculatorService.LOW_MAX:
            return "LOW"
        if score <= BurnoutCalculatorService.MEDIUM_MAX:
            return "MEDIUM"
        if score <= BurnoutCalculatorService.HIGH_MAX:
            return "HIGH"
        return "CRITICAL"
