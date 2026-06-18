from django.db import models


class UserRole(models.TextChoices):
    EMPLOYEE = "EMPLOYEE", "Employee"
    MANAGER = "MANAGER", "Manager"
    HR = "HR", "HR"
    ADMIN = "ADMIN", "Admin"