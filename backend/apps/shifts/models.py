import uuid

from django.db import models

from .constants import ShiftStatus


class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.CASCADE,
        related_name="shifts",
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    assigned_employee = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_shifts",
    )
    status = models.CharField(
        max_length=30, choices=ShiftStatus.choices, default=ShiftStatus.OPEN
    )
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_shifts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "shifts"
        ordering = ["start_time"]

    def __str__(self) -> str:
        return f"{self.title} ({self.start_time:%Y-%m-%d %H:%M})"

    @property
    def duration_hours(self) -> float:
        delta = self.end_time - self.start_time
        return round(delta.total_seconds() / 3600, 2)
