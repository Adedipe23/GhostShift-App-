import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.audit.models import AuditLog
from apps.users.models import User


class Command(BaseCommand):
    help = "Seeds the database with realistic audit logs for testing"

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing audit logs...")
        AuditLog.objects.all().delete()

        users = list(User.objects.all())
        admin_user = next((u for u in users if u.role == 'ADMIN'), None)
        manager_user = next((u for u in users if u.role == 'MANAGER'), None)
        employee_user = next((u for u in users if u.role == 'EMPLOYEE'), None)

        # Some template logs
        logs_templates = [
            {
                "action": "Admin user logged in successfully",
                "category": "AUTH",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/auth/login/",
                "actor": admin_user,
                "actor_email": admin_user.email if admin_user else "admin@ghostshift.com",
                "response_status": 200,
                "extra": {"ip": "192.168.1.50"}
            },
            {
                "action": "Failed login attempt: Invalid password",
                "category": "AUTH",
                "status": "WARNING",
                "method": "POST",
                "path": "/api/auth/login/",
                "actor": None,
                "actor_email": "intruder@example.com",
                "response_status": 401,
                "extra": {"reason": "invalid_credentials"}
            },
            {
                "action": "Triggered weekly shift burnout recalculation scheduler",
                "category": "SYSTEM",
                "status": "INFO",
                "method": "POST",
                "path": "/api/burnout/recalculate/",
                "actor": None,
                "actor_email": "",
                "response_status": 202,
                "extra": {"triggered_by": "cron_scheduler"}
            },
            {
                "action": "Approved swap request #14",
                "category": "SWAPS",
                "status": "SUCCESS",
                "method": "PUT",
                "path": "/api/swaps/14/approve/",
                "actor": manager_user,
                "actor_email": manager_user.email if manager_user else "manager@ghostshift.com",
                "response_status": 200,
                "extra": {"shift_id": "99b9cf98-89c0-4375-9275-8e6fa89c03b1"}
            },
            {
                "action": "Created new department: Emergency Room",
                "category": "DEPARTMENTS",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/departments/",
                "actor": admin_user,
                "actor_email": admin_user.email if admin_user else "admin@ghostshift.com",
                "response_status": 201,
                "extra": {"dept_name": "Emergency Room"}
            },
            {
                "action": "Registered new user: dr.house@ghostshift.com",
                "category": "USERS",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/auth/register/",
                "actor": admin_user,
                "actor_email": admin_user.email if admin_user else "admin@ghostshift.com",
                "response_status": 201,
                "extra": {"role": "EMPLOYEE"}
            },
            {
                "action": "Failed to delete department: Active shifts exist",
                "category": "DEPARTMENTS",
                "status": "ERROR",
                "method": "DELETE",
                "path": "/api/departments/er/",
                "actor": admin_user,
                "actor_email": admin_user.email if admin_user else "admin@ghostshift.com",
                "response_status": 400,
                "extra": {"error": "Foreign key constraint on shift"}
            },
            {
                "action": "Clocked in for shift starting 08:00",
                "category": "ATTENDANCE",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/attendance/clock-in/",
                "actor": employee_user,
                "actor_email": employee_user.email if employee_user else "employee@ghostshift.com",
                "response_status": 200,
                "extra": {"lat_diff": "3.5 mins"}
            },
            {
                "action": "Clocked out of shift ending 16:00",
                "category": "ATTENDANCE",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/attendance/clock-out/",
                "actor": employee_user,
                "actor_email": employee_user.email if employee_user else "employee@ghostshift.com",
                "response_status": 200,
                "extra": {"duration_hours": 8.0}
            },
            {
                "action": "Created new shift template: Night Shift - ER",
                "category": "SHIFTS",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/shifts/",
                "actor": manager_user,
                "actor_email": manager_user.email if manager_user else "manager@ghostshift.com",
                "response_status": 201,
                "extra": {"time": "22:00 - 06:00"}
            },
            {
                "action": "Updated availability schedule for June 2026",
                "category": "AVAILABILITY",
                "status": "SUCCESS",
                "method": "PATCH",
                "path": "/api/availability/me/",
                "actor": employee_user,
                "actor_email": employee_user.email if employee_user else "employee@ghostshift.com",
                "response_status": 200,
                "extra": {"updated_days": [14, 15, 17]}
            },
            {
                "action": "Dispatched emergency notifications: High Burnout warning",
                "category": "NOTIFICATIONS",
                "status": "SUCCESS",
                "method": "POST",
                "path": "/api/notifications/dispatch/",
                "actor": None,
                "actor_email": "",
                "response_status": 200,
                "extra": {"recipients_count": 3}
            },
            {
                "action": "Database migration contenttypes initial... OK",
                "category": "SYSTEM",
                "status": "INFO",
                "method": "MIGRATE",
                "path": "",
                "actor": None,
                "actor_email": "",
                "response_status": 200,
                "extra": {}
            },
            {
                "action": "Unauthorized access to Admin users list",
                "category": "USERS",
                "status": "WARNING",
                "method": "GET",
                "path": "/api/auth/users/",
                "actor": employee_user,
                "actor_email": employee_user.email if employee_user else "employee@ghostshift.com",
                "response_status": 403,
                "extra": {"permission_class": "IsAdmin"}
            },
            {
                "action": "Critical database deadlock resolved",
                "category": "SYSTEM",
                "status": "WARNING",
                "method": "",
                "path": "",
                "actor": None,
                "actor_email": "",
                "response_status": 500,
                "extra": {"deadlock_seconds": 1.2}
            }
        ]

        now = timezone.now()
        for idx, log_data in enumerate(logs_templates):
            # Stagger timestamps back in time
            timestamp = now - timedelta(hours=idx, minutes=random.randint(1, 59))
            
            # Create AuditLog object
            log = AuditLog.objects.create(
                action=log_data["action"],
                category=log_data["category"],
                status=log_data["status"],
                method=log_data["method"],
                path=log_data["path"],
                actor=log_data["actor"],
                actor_email=log_data["actor_email"],
                response_status=log_data["response_status"],
                extra=log_data["extra"]
            )
            
            # Override auto_now_add timestamp
            AuditLog.objects.filter(id=log.id).update(timestamp=timestamp)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(logs_templates)} audit logs!"))
