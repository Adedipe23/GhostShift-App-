import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.mark.django_db
class TestUserDelete:
    def test_admin_cannot_delete_self(self, api_client, admin_user):
        # Authenticate as admin
        token = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

        # Try to delete self
        url = f"/api/auth/users/{admin_user.id}/"
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["detail"] == "You cannot delete your own account."
        assert User.objects.filter(id=admin_user.id).exists()

    def test_admin_can_delete_other_user(self, api_client, admin_user, employee_user):
        # Authenticate as admin
        token = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

        # Delete other user
        url = f"/api/auth/users/{employee_user.id}/"
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=employee_user.id).exists()
