"""Swap endpoint tests."""

import pytest

from apps.availability.models import Availability
from apps.swaps.models import SwapStatus
from tests.factories import ShiftFactory, SwapRequestFactory, UserFactory


@pytest.mark.django_db
class TestSwapCreate:
    url = "/api/swaps/"

    def test_create_swap_request(self, auth_client, employee_user, department):
        # Setup: Employee wants to swap their shift with a replacement employee
        shift = ShiftFactory(department=department, assigned_employee=employee_user)
        replacement = UserFactory(role="EMPLOYEE", department=department)

        payload = {
            "shift": str(shift.id),
            "replacement_employee": str(replacement.id),
        }
        response = auth_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "PENDING"
        assert str(response.data["requester"]) == str(employee_user.id)

    def test_swap_unavailable_replacement(self, auth_client, employee_user, department):
        shift = ShiftFactory(department=department, assigned_employee=employee_user)
        replacement = UserFactory(role="EMPLOYEE", department=department)
        
        # Mark replacement as unavailable on the shift date
        Availability.objects.create(
            employee=replacement,
            date=shift.start_time.date(),
            available=False
        )

        payload = {
            "shift": str(shift.id),
            "replacement_employee": str(replacement.id),
        }
        response = auth_client.post(self.url, payload, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
class TestSwapApproval:
    def test_approve_swap_as_manager(self, manager_client, manager_user):
        swap = SwapRequestFactory()
        replacement = swap.replacement_employee
        
        url = f"/api/swaps/{swap.id}/approve/"
        response = manager_client.put(url, {"manager_comment": "Approved."}, format="json")
        
        assert response.status_code == 200
        
        # Check DB updates
        swap.refresh_from_db()
        assert swap.status == SwapStatus.APPROVED
        assert swap.reviewed_by == manager_user
        assert swap.manager_comment == "Approved."
        
        # Check shift reassigned
        assert swap.shift.assigned_employee == replacement

    def test_reject_swap_as_manager(self, manager_client, manager_user):
        swap = SwapRequestFactory()
        
        url = f"/api/swaps/{swap.id}/reject/"
        response = manager_client.put(url, {"manager_comment": "Denied."}, format="json")
        
        assert response.status_code == 200
        
        swap.refresh_from_db()
        assert swap.status == SwapStatus.REJECTED
        assert swap.reviewed_by == manager_user
