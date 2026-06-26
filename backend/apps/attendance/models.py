import uuid

from django.db import models


class TimeEntryStatus(models.TextChoices):
    NOT_STARTED = "NOT_STARTED", "Not Started"
    CLOCKED_IN = "CLOCKED_IN", "Clocked In"
    CLOCKED_OUT = "CLOCKED_OUT", "Clocked Out"
    EARLY_CHECKOUT_PENDING = "EARLY_CHECKOUT_PENDING", "Early Checkout Pending"
    EARLY_CHECKOUT = "EARLY_CHECKOUT", "Early Checkout"
    NO_SHOW = "NO_SHOW", "No Show"

class TimeEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="time_entries")
    shift = models.ForeignKey("shifts.Shift", on_delete=models.CASCADE, related_name="time_entries")
    clock_in_time = models.DateTimeField(null=True, blank=True)
    clock_out_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=TimeEntryStatus.choices, default=TimeEntryStatus.NOT_STARTED)
    total_worked_hours = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendance_time_entries"
        unique_together = ("employee", "shift")

    def __str__(self):
        return f"{self.employee.email} - {self.shift.title} ({self.status})"

class IncidentType(models.TextChoices):
    ILLNESS = "ILLNESS", "Illness"
    INJURY = "INJURY", "Injury"
    FAMILY_EMERGENCY = "FAMILY_EMERGENCY", "Family Emergency"
    PERSONAL_EMERGENCY = "PERSONAL_EMERGENCY", "Personal Emergency"
    OTHER = "OTHER", "Other"

class ShiftIncident(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="shift_incidents")
    shift = models.ForeignKey("shifts.Shift", on_delete=models.CASCADE, related_name="incidents")
    incident_type = models.CharField(max_length=30, choices=IncidentType.choices)
    description = models.TextField()
    reported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attendance_shift_incidents"
        ordering = ["-reported_at"]

    def __str__(self):
        return f"{self.incident_type} - {self.employee.email} - {self.shift.title}"
