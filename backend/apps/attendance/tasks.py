from django.utils import timezone

from apps.notifications.tasks import send_notification_task
from apps.shifts.constants import ShiftStatus
from apps.shifts.models import Shift

from .models import TimeEntry, TimeEntryStatus


def check_no_shows():
    """
    Run every 15 mins via Django Q2.
    Checks shifts that started > 30 mins ago and have no TimeEntry.
    Marks them as NO_SHOW and notifies managers.
    """
    now = timezone.now()
    cutoff = now - timezone.timedelta(minutes=30)
    
    # Shifts that were scheduled to start before cutoff, and are still UPCOMING/SCHEDULED
    abandoned_shifts = Shift.objects.filter(
        status__in=[ShiftStatus.SCHEDULED, ShiftStatus.UPCOMING],
        start_time__lte=cutoff
    ).exclude(time_entries__isnull=False)
    
    for shift in abandoned_shifts:
        TimeEntry.objects.create(
            employee=shift.assigned_employee,
            shift=shift,
            status=TimeEntryStatus.NO_SHOW
        )
        # Shift status could be changed to OPEN or REPLACEMENT_REQUESTED
        shift.status = ShiftStatus.OPEN
        shift.assigned_employee = None
        shift.save()
        
        from apps.users.models import User
        managers = User.objects.filter(role__in=["MANAGER", "HR", "ADMIN"])
        for m in managers:
            send_notification_task(
                m.id,
                "No-Show Alert",
                f"Shift {shift.title} starting at {shift.start_time} had a no-show. It has been marked OPEN."
            )
