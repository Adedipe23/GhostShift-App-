"""Shift endpoint tests."""

import pytest
from django.utils import timezone

from tests.factories import ShiftFactory


@pytest.mark.django_db
class TestShiftList:
    url = "/api/shifts/"

    def test_list_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_employee_sees_own_shifts(self, auth_client, shift):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_manager_sees_all_shifts(self, manager_client, shift):
        response = manager_client.get(self.url)
        assert response.status_code == 200
        assert response.data["count"] >= 1


@pytest.mark.django_db
class TestShiftCreate:
    url = "/api/shifts/"

    def test_create_shift_as_manager(self, manager_client, manager_user, department, employee_user):
        now = timezone.now().replace(microsecond=0)
        payload = {
            "title": "Morning Shift",
            "department": str(department.id),
            "start_time": (now + timezone.timedelta(days=2)).isoformat(),
            "end_time": (now + timezone.timedelta(days=2, hours=8)).isoformat(),
            "assigned_employee": str(employee_user.id),
            "status": "SCHEDULED",
        }
        response = manager_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        assert response.data["title"] == "Morning Shift"

    def test_employee_cannot_create_shift(self, auth_client, department, employee_user):
        now = timezone.now()
        payload = {
            "title": "Unauthorized Shift",
            "department": str(department.id),
            "start_time": (now + timezone.timedelta(days=3)).isoformat(),
            "end_time": (now + timezone.timedelta(days=3, hours=8)).isoformat(),
            "assigned_employee": str(employee_user.id),
            "status": "SCHEDULED",
        }
        response = auth_client.post(self.url, payload, format="json")
        assert response.status_code == 403

    def test_overlapping_shift_rejected(self, manager_client, department, employee_user):
        """Creating a shift that overlaps an existing one should return 400."""
        now = timezone.now().replace(second=0, microsecond=0)
        start = now + timezone.timedelta(days=5, hours=8)
        end = start + timezone.timedelta(hours=8)

        # Create first shift
        ShiftFactory(
            department=department,
            assigned_employee=employee_user,
            start_time=start,
            end_time=end,
            status="SCHEDULED",
        )

        # Try to create overlapping shift
        payload = {
            "title": "Overlapping Shift",
            "department": str(department.id),
            "start_time": (start + timezone.timedelta(hours=2)).isoformat(),
            "end_time": (end + timezone.timedelta(hours=2)).isoformat(),
            "assigned_employee": str(employee_user.id),
            "status": "SCHEDULED",
        }
        response = manager_client.post(self.url, payload, format="json")
        assert response.status_code == 400

    def test_end_before_start_rejected(self, manager_client, department, employee_user):
        now = timezone.now()
        payload = {
            "title": "Bad Times",
            "department": str(department.id),
            "start_time": (now + timezone.timedelta(days=4, hours=8)).isoformat(),
            "end_time": (now + timezone.timedelta(days=4, hours=4)).isoformat(),
            "assigned_employee": str(employee_user.id),
            "status": "SCHEDULED",
        }
        response = manager_client.post(self.url, payload, format="json")
        assert response.status_code == 400
