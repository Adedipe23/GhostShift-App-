"""Pytest fixtures shared across all test modules."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from tests.factories import DepartmentFactory, ShiftFactory, UserFactory

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department(db):
    return DepartmentFactory()


@pytest.fixture
def employee_user(db, department):
    user = UserFactory(role="EMPLOYEE", department=department)
    return user


@pytest.fixture
def manager_user(db, department):
    user = UserFactory(role="MANAGER", department=department)
    return user


@pytest.fixture
def hr_user(db, department):
    return UserFactory(role="HR", department=department)


@pytest.fixture
def admin_user(db):
    return UserFactory(role="ADMIN", is_staff=True)


@pytest.fixture
def auth_client(api_client, employee_user):
    """API client authenticated as an employee."""
    token = RefreshToken.for_user(employee_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return api_client


@pytest.fixture
def manager_client(api_client, manager_user):
    """API client authenticated as a manager."""
    token = RefreshToken.for_user(manager_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return api_client


@pytest.fixture
def shift(db, department, employee_user):
    return ShiftFactory(department=department, assigned_employee=employee_user)
