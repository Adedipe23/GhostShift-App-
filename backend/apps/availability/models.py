import uuid

from django.db import models


class Availability(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="availability_entries"
    )
    date = models.DateField()
    available = models.BooleanField(default=True)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "availability"
        unique_together = ["employee", "date"]
        ordering = ["date"]

    def __str__(self):
        status = "Available" if self.available else "Unavailable"
        return f"{self.employee.email} — {self.date} ({status})"
