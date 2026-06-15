import uuid

from django.db import models


class AuditLog(models.Model):
    """Records every significant API action for admin review."""

    class Category(models.TextChoices):
        AUTH = "AUTH", "Authentication"
        USERS = "USERS", "Users"
        SHIFTS = "SHIFTS", "Shifts"
        SWAPS = "SWAPS", "Swaps"
        ATTENDANCE = "ATTENDANCE", "Attendance"
        DEPARTMENTS = "DEPARTMENTS", "Departments"
        AVAILABILITY = "AVAILABILITY", "Availability"
        NOTIFICATIONS = "NOTIFICATIONS", "Notifications"
        SYSTEM = "SYSTEM", "System"

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        WARNING = "WARNING", "Warning"
        ERROR = "ERROR", "Error"
        INFO = "INFO", "Info"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who did it
    actor = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    actor_email = models.EmailField(blank=True, default="")  # snapshot in case user deleted

    # What happened
    action = models.CharField(max_length=255)
    category = models.CharField(
        max_length=30, choices=Category.choices, default=Category.SYSTEM
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.INFO
    )

    # Request metadata
    method = models.CharField(max_length=10, blank=True, default="")
    path = models.CharField(max_length=500, blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    response_status = models.PositiveSmallIntegerField(null=True, blank=True)

    # Optional extra detail (JSON blob)
    extra = models.JSONField(null=True, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["-timestamp"]),
            models.Index(fields=["category"]),
            models.Index(fields=["actor"]),
        ]

    def __str__(self) -> str:
        return f"[{self.category}] {self.action} — {self.actor_email or 'System'}"
