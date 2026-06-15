import uuid

from django.db import models

from .choices import RiskLevel


class BurnoutScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="burnout_scores"
    )
    score = models.IntegerField(default=0)  # 0-100
    risk_level = models.CharField(
        max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW
    )
    weekly_hours = models.FloatField(default=0)
    consecutive_shifts = models.IntegerField(default=0)
    night_shifts = models.IntegerField(default=0)
    rest_hours = models.FloatField(default=8)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "burnout_scores"
        ordering = ["-calculated_at"]
        get_latest_by = "calculated_at"

    def __str__(self):
        return f"{self.employee.email} — Score: {self.score} ({self.risk_level})"
