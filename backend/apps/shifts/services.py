from datetime import timedelta

from rest_framework.exceptions import ValidationError

from .models import Shift


class ShiftService:
    """Service layer enforcing all business rules for shifts."""
    from .constants import MAX_WEEKLY_HOURS, MIN_REST_HOURS

    @staticmethod
    def validate_availability(employee, start_time):
        """Raise ValidationError if employee explicitly marked themselves unavailable on this date."""
        from apps.availability.models import Availability
        shift_date = start_time.date()
        unavailability = Availability.objects.filter(
            employee=employee,
            date=shift_date,
            available=False
        ).first()
        if unavailability:
            raise ValidationError(
                f"Employee has explicitly marked themselves as unavailable on {shift_date}. "
                f"Reason: {unavailability.note or 'No reason provided'}."
            )

    @staticmethod
    def validate_no_overlap(employee, start_time, end_time, exclude_id=None):
        """Raise ValidationError if employee has an overlapping shift."""
        qs = Shift.objects.filter(
            assigned_employee=employee,
            status__in=("SCHEDULED", "OPEN"),
            start_time__lt=end_time,
            end_time__gt=start_time,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            raise ValidationError(
                "This employee already has a shift that overlaps with the requested time."
            )

    @staticmethod
    def validate_weekly_hours(employee, shift_start, extra_hours, exclude_id=None):
        """Raise ValidationError if assigning this shift would exceed 60 hrs/week."""
        week_start = shift_start - timedelta(days=shift_start.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        qs = Shift.objects.filter(
            assigned_employee=employee,
            status__in=("SCHEDULED", "OPEN"),
            start_time__gte=week_start,
            start_time__lt=week_end,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)

        existing_seconds = sum(
            (s.end_time - s.start_time).total_seconds() for s in qs
        )
        existing_hours = existing_seconds / 3600
        if existing_hours + extra_hours > ShiftService.MAX_WEEKLY_HOURS:
            raise ValidationError(
                f"Assigning this shift would exceed the {ShiftService.MAX_WEEKLY_HOURS}-hour weekly limit. "
                f"Current: {existing_hours:.1f}h, Adding: {extra_hours:.1f}h."
            )

    @staticmethod
    def validate_rest_hours(employee, new_start_time, exclude_id=None):
        """Raise ValidationError if less than 8 hours rest since last shift end."""
        min_start = new_start_time - timedelta(hours=ShiftService.MIN_REST_HOURS)
        qs = Shift.objects.filter(
            assigned_employee=employee,
            status__in=("SCHEDULED", "OPEN"),
            end_time__gt=min_start,
            end_time__lte=new_start_time,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            raise ValidationError(
                f"Employee must have at least {ShiftService.MIN_REST_HOURS} hours of rest between shifts."
            )

    @classmethod
    def validate_all(cls, employee, start_time, end_time, shift_department=None, exclude_id=None):
        """Run all shift validation rules."""
        if end_time <= start_time:
            raise ValidationError("Shift end time must be after start time.")
        
        if shift_department and employee.department_id != shift_department.id:
            raise ValidationError(f"Employee {employee.email} cannot be assigned outside their department.")
            
        duration_hours = (end_time - start_time).total_seconds() / 3600
        cls.validate_availability(employee, start_time)
        cls.validate_no_overlap(employee, start_time, end_time, exclude_id)
        cls.validate_rest_hours(employee, start_time, exclude_id)
        cls.validate_weekly_hours(employee, start_time, duration_hours, exclude_id)
