from rest_framework.exceptions import ValidationError

from apps.availability.models import Availability
from apps.shifts.services import ShiftService


class SwapService:
    """Validates swap requests against business rules."""

    @staticmethod
    def validate_swap(requester, shift, replacement):
        """
        Validate a swap request:
        1. Replacement must be available on shift date.
        2. Replacement must belong to same department.
        3. Replacement cannot exceed weekly hour limits.
        4. Replacement cannot have an overlapping shift.
        """
        shift_date = shift.start_time.date()

        # 1. Check availability
        availability = Availability.objects.filter(
            employee=replacement, date=shift_date
        ).first()
        if availability and not availability.available:
            raise ValidationError(
                f"{replacement.full_name} is marked as unavailable on {shift_date}."
            )

        # 2. Same department & role check
        if replacement.department != shift.department:
            raise ValidationError(
                f"{replacement.full_name} is not in the {shift.department.name} department."
            )
        if replacement.role != "EMPLOYEE":
            raise ValidationError(
                "Shift replacements must have the EMPLOYEE role."
            )

        # 3 & 4. Hour limit + overlap via ShiftService
        duration_hours = (shift.end_time - shift.start_time).total_seconds() / 3600
        ShiftService.validate_no_overlap(replacement, shift.start_time, shift.end_time)
        ShiftService.validate_weekly_hours(replacement, shift.start_time, duration_hours)
