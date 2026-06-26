"""Burnout router mounted at /calculate-burnout in main.py."""

from fastapi import APIRouter

from schemas.burnout import BurnoutInput, BurnoutOutput
from services.burnout_calculator import BurnoutCalculatorService

router = APIRouter(tags=["Burnout"])

_calculator = BurnoutCalculatorService()


@router.post(
    "",
    response_model=BurnoutOutput,
    summary="Calculate burnout risk score",
    description=(
        "Accepts shift metrics and returns a burnout risk score (0-100), "
        "risk level (LOW/MEDIUM/HIGH/CRITICAL), a per-factor breakdown, "
        "and actionable recommendations."
    ),
)
async def calculate_burnout(payload: BurnoutInput) -> BurnoutOutput:
    """POST /calculate-burnout — compute burnout risk from shift data."""
    return _calculator.calculate(payload)
