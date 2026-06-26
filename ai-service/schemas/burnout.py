"""Pydantic v2 schemas for burnout calculation."""

from pydantic import BaseModel, Field


class BurnoutInput(BaseModel):
    """Input payload for burnout risk calculation."""

    weekly_hours: float = Field(
        ..., ge=0, le=168, description="Total hours worked this week"
    )
    consecutive_shifts: int = Field(
        ..., ge=0, description="Number of consecutive days worked"
    )
    night_shifts: int = Field(
        ..., ge=0, description="Number of night shifts worked this week"
    )
    rest_hours: float = Field(
        ..., ge=0, description="Minimum rest hours between shifts"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "weekly_hours": 55,
                    "consecutive_shifts": 6,
                    "night_shifts": 4,
                    "rest_hours": 5,
                }
            ]
        }
    }


class BurnoutOutput(BaseModel):
    """Output payload from burnout risk calculation."""

    score: int = Field(..., ge=0, le=100, description="Burnout risk score 0-100")
    risk_level: str = Field(
        ..., description="Risk level: LOW | MEDIUM | HIGH | CRITICAL"
    )
    factors: dict[str, int] = Field(
        ..., description="Score contribution breakdown per risk factor"
    )
    recommendations: list[str] = Field(
        ..., description="Human-readable recommendations based on risk factors"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "score": 78,
                    "risk_level": "CRITICAL",
                    "factors": {
                        "weekly_hours": 20,
                        "consecutive_shifts": 20,
                        "night_shifts": 15,
                        "rest_hours": 25,
                    },
                    "recommendations": [
                        "Reduce weekly hours below 50",
                        "Schedule mandatory rest days after 5 consecutive shifts",
                        "Limit night shifts to 3 per week",
                        "Ensure minimum 8 hours rest between shifts",
                    ],
                }
            ]
        }
    }
