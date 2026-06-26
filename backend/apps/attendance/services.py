from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.notifications.tasks import send_notification_task
from apps.shifts.constants import ShiftStatus
from apps.shifts.models import Shift

from .models import ShiftIncident, TimeEntry, TimeEntryStatus


class AttendanceService:
    @staticmethod
    def clock_in(user, shift_id):
        shift = Shift.objects.filter(id=shift_id, assigned_employee=user).first()
        if not shift:
            raise ValidationError("Shift not found or not assigned to you.")
        
        now = timezone.now()
        # Allow clock in 30 mins before or after start_time
        start_bound = shift.start_time - timezone.timedelta(minutes=30)
        end_bound = shift.start_time + timezone.timedelta(minutes=30)
        
        if not (start_bound <= now <= end_bound):
            raise ValidationError(f"You can only clock in between {start_bound.strftime('%H:%M')} and {end_bound.strftime('%H:%M')}.")
            
        entry, created = TimeEntry.objects.get_or_create(
            employee=user,
            shift=shift,
            defaults={
                "clock_in_time": now,
                "status": TimeEntryStatus.CLOCKED_IN
            }
        )
        if not created and entry.status != TimeEntryStatus.NOT_STARTED:
            raise ValidationError("You have already clocked in for this shift.")
            
        entry.clock_in_time = now
        entry.status = TimeEntryStatus.CLOCKED_IN
        entry.save()
        
        shift.status = ShiftStatus.CLOCKED_IN
        shift.save()
        return entry

    @staticmethod
    def clock_out(user, shift_id):
        entry = TimeEntry.objects.filter(employee=user, shift_id=shift_id, status=TimeEntryStatus.CLOCKED_IN).first()
        if not entry:
            raise ValidationError("You must be clocked in to clock out.")
            
        now = timezone.now()
        entry.clock_out_time = now
        entry.status = TimeEntryStatus.CLOCKED_OUT
        
        duration = now - entry.clock_in_time
        entry.total_worked_hours = round(duration.total_seconds() / 3600.0, 2)
        entry.save()
        
        shift = entry.shift
        shift.status = ShiftStatus.CLOCKED_OUT
        shift.save()
        return entry

    @staticmethod
    def emergency_checkout(user, shift_id, incident_type, description):
        entry = TimeEntry.objects.filter(employee=user, shift_id=shift_id, status=TimeEntryStatus.CLOCKED_IN).first()
        if not entry:
            raise ValidationError("You must be clocked in to request emergency checkout.")
            
        ShiftIncident.objects.create(
            employee=user,
            shift=entry.shift,
            incident_type=incident_type,
            description=description
        )
        
        entry.status = TimeEntryStatus.EARLY_CHECKOUT_PENDING
        entry.save()
        
        shift = entry.shift
        shift.status = ShiftStatus.EARLY_CHECKOUT_PENDING
        shift.save()
        
        # Notify managers
        from apps.users.models import User
        managers = User.objects.filter(role__in=["MANAGER", "HR", "ADMIN"])
        for m in managers:
            send_notification_task(
                m.id,
                "Emergency Checkout Request",
                f"{user.first_name} requested emergency checkout for {shift.title} due to {incident_type}."
            )
            
        return entry

    @staticmethod
    def approve_emergency_checkout(manager, entry_id):
        entry = TimeEntry.objects.filter(id=entry_id, status=TimeEntryStatus.EARLY_CHECKOUT_PENDING).first()
        if not entry:
            raise ValidationError("Emergency checkout request not found or not pending.")
            
        now = timezone.now()
        entry.clock_out_time = now
        entry.status = TimeEntryStatus.EARLY_CHECKOUT
        duration = now - entry.clock_in_time
        entry.total_worked_hours = round(duration.total_seconds() / 3600.0, 2)
        entry.save()
        
        shift = entry.shift
        shift.status = ShiftStatus.EARLY_CHECKOUT
        shift.save()
        
        send_notification_task(
            entry.employee.id,
            "Emergency Checkout Approved",
            f"Your early checkout for {shift.title} has been approved."
        )
        
        return entry

    @staticmethod
    def reject_emergency_checkout(manager, entry_id):
        entry = TimeEntry.objects.filter(id=entry_id, status=TimeEntryStatus.EARLY_CHECKOUT_PENDING).first()
        if not entry:
            raise ValidationError("Emergency checkout request not found or not pending.")
            
        entry.status = TimeEntryStatus.CLOCKED_IN
        entry.save()
        
        shift = entry.shift
        shift.status = ShiftStatus.CLOCKED_IN
        shift.save()
        
        send_notification_task(
            entry.employee.id,
            "Emergency Checkout Rejected",
            f"Your early checkout for {shift.title} has been rejected. Please continue your shift."
        )
        return entry
