"""Factory Boy factories for all models."""

import factory
from django.contrib.auth import get_user_model
from django.utils import timezone
from factory.django import DjangoModelFactory

from apps.departments.models import Department
from apps.shifts.models import Shift, ShiftStatus
from apps.swaps.models import SwapRequest

User = get_user_model()


class DepartmentFactory(DjangoModelFactory):
    class Meta:
        model = Department

    name = factory.Sequence(lambda n: f"Department {n}")
    description = factory.Faker("sentence")


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@ghostshift.test")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = "EMPLOYEE"
    department = factory.SubFactory(DepartmentFactory)
    is_active = True
    is_staff = False
    password = factory.PostGenerationMethodCall("set_password", "TestPass123!")


class ShiftFactory(DjangoModelFactory):
    class Meta:
        model = Shift

    title = factory.Sequence(lambda n: f"Shift {n}")
    department = factory.SubFactory(DepartmentFactory)
    start_time = factory.LazyFunction(
        lambda: timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
    )
    end_time = factory.LazyAttribute(
        lambda obj: obj.start_time + timezone.timedelta(hours=8)
    )
    assigned_employee = factory.SubFactory(UserFactory)
    status = ShiftStatus.SCHEDULED
    created_by = factory.SubFactory(UserFactory, role="MANAGER")


class SwapRequestFactory(DjangoModelFactory):
    class Meta:
        model = SwapRequest

    requester = factory.SubFactory(UserFactory)
    shift = factory.SubFactory(ShiftFactory)
    replacement_employee = factory.SubFactory(UserFactory)
    status = "PENDING"
