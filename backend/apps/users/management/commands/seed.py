import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.availability.models import Availability
from apps.burnout.models import BurnoutScore, RiskLevel
from apps.departments.models import Department
from apps.shifts.models import Shift, ShiftStatus
from apps.swaps.models import SwapRequest, SwapStatus

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial test data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # 1. Departments
        dept_names = ["Emergency", "ICU", "Pediatrics", "Surgery"]
        departments = []
        for name in dept_names:
            dept, _ = Department.objects.get_or_create(
                name=name,
                defaults={"description": f"{name} department"}
            )
            departments.append(dept)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(departments)} departments.'))

        # 2. Users
        users = []
        
        # Admin
        admin, created = User.objects.get_or_create(email="admin@ghostshift.test")
        if created:
            admin.set_password("Admin123!")
            admin.first_name = "System"
            admin.last_name = "Admin"
            admin.role = "ADMIN"
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
            users.append(admin)

        # HR
        hr, created = User.objects.get_or_create(email="hr@ghostshift.test")
        if created:
            hr.set_password("HRpass123!")
            hr.first_name = "Human"
            hr.last_name = "Resources"
            hr.role = "HR"
            hr.save()
            users.append(hr)

        # Managers
        managers = []
        for i in range(2):
            manager, created = User.objects.get_or_create(email=f"manager{i+1}@ghostshift.test")
            if created:
                manager.set_password("Manager123!")
                manager.first_name = "Manager"
                manager.last_name = str(i+1)
                manager.role = "MANAGER"
                manager.department = random.choice(departments)
                manager.save()
                managers.append(manager)
                users.append(manager)

        # Employees
        employees = []
        for i in range(10):
            emp, created = User.objects.get_or_create(email=f"employee{i+1}@ghostshift.test")
            if created:
                emp.set_password("Employee123!")
                emp.first_name = "Employee"
                emp.last_name = str(i+1)
                emp.role = "EMPLOYEE"
                emp.department = random.choice(departments)
                emp.save()
                employees.append(emp)
                users.append(emp)

        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users.'))

        # 3. Shifts
        now = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        
        shifts = []
        # Create shifts for current week
        for i in range(5): # Monday to Friday
            current_day = week_start + timedelta(days=i)
            
            # Create 2 shifts per day
            for j in range(2):
                shift_start = current_day + timedelta(hours=8 + (j*8)) # 8am and 4pm
                shift_end = shift_start + timedelta(hours=8)
                
                emp = random.choice(employees)
                
                # Check for overlap naively
                overlap = False
                for s in shifts:
                    if s.assigned_employee == emp and s.start_time < shift_end and s.end_time > shift_start:
                        overlap = True
                        break
                
                if not overlap:
                    shift = Shift.objects.create(
                        title=f"{'Morning' if j==0 else 'Evening'} Shift",
                        department=emp.department,
                        start_time=shift_start,
                        end_time=shift_end,
                        assigned_employee=emp,
                        status=ShiftStatus.SCHEDULED if shift_start > timezone.now() else ShiftStatus.COMPLETED,
                        created_by=random.choice(managers)
                    )
                    shifts.append(shift)

        self.stdout.write(self.style.SUCCESS(f'Created {len(shifts)} shifts.'))

        # 4. Availability
        for emp in employees:
            # Mark a random day next week as unavailable
            unavailable_date = (week_start + timedelta(days=random.randint(7, 11))).date()
            Availability.objects.get_or_create(
                employee=emp,
                date=unavailable_date,
                defaults={
                    "available": False,
                    "note": "Doctor appointment"
                }
            )

        # 5. Swap Requests
        if len(shifts) >= 2:
            future_shifts = [s for s in shifts if s.start_time > timezone.now()]
            if future_shifts:
                shift_to_swap = future_shifts[0]
                requester = shift_to_swap.assigned_employee
                # Find replacement in same dept
                replacements = [e for e in employees if e != requester and e.department == shift_to_swap.department]
                if replacements:
                    replacement = random.choice(replacements)
                    SwapRequest.objects.get_or_create(
                        requester=requester,
                        shift=shift_to_swap,
                        replacement_employee=replacement,
                        defaults={
                            "status": SwapStatus.PENDING
                        }
                    )
                    self.stdout.write(self.style.SUCCESS('Created 1 pending swap request.'))

        # 6. Burnout Scores
        for emp in employees:
            BurnoutScore.objects.create(
                employee=emp,
                score=random.randint(10, 85),
                risk_level=random.choice([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]),
                weekly_hours=random.randint(30, 55),
                consecutive_shifts=random.randint(2, 6),
                night_shifts=random.randint(0, 3)
            )

        self.stdout.write(self.style.SUCCESS('Database successfully seeded!'))
        self.stdout.write(self.style.WARNING('\nTest Accounts:'))
        self.stdout.write('Admin: admin@ghostshift.test / Admin123!')
        self.stdout.write('HR: hr@ghostshift.test / HRpass123!')
        self.stdout.write('Manager: manager1@ghostshift.test / Manager123!')
        self.stdout.write('Employee: employee1@ghostshift.test / Employee123!')
