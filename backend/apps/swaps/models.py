import uuid

from django.db import models

from .constants import SwapStatus


class SwapRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="swap_requests_made"
    )
    shift = models.ForeignKey(
        "shifts.Shift", on_delete=models.CASCADE, related_name="swap_requests"
    )
    replacement_employee = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="swap_replacements"
    )
    status = models.CharField(
        max_length=20, choices=SwapStatus.choices, default=SwapStatus.PENDING
    )
    manager_comment = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="swap_reviews",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "swap_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Swap: {self.requester.email} → {self.replacement_employee.email} ({self.status})"
