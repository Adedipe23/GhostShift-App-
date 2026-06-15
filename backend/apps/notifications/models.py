import uuid

from django.db import models


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    notification_type = models.CharField(
        max_length=50,
        default="INFO",
        choices=[
            ("INFO", "Info"),
            ("WARNING", "Warning"),
            ("SUCCESS", "Success"),
            ("ALERT", "Alert"),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.title}"
