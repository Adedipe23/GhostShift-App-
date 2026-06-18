"""Auth endpoint tests."""

import pytest


@pytest.mark.django_db
class TestRegister:
    url = "/api/auth/register/"

    def test_register_success(self, api_client, department):
        payload = {
            "email": "new@ghostshift.test",
            "first_name": "Jane",
            "last_name": "Doe",
            "role": "EMPLOYEE",
            "department": str(department.id),
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == 201
        assert response.data["user"]["email"] == "new@ghostshift.test"

    def test_register_password_mismatch(self, api_client):
        payload = {
            "email": "bad@ghostshift.test",
            "first_name": "Bad",
            "last_name": "User",
            "password": "SecurePass123!",
            "confirm_password": "WrongPass!",
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == 400

    def test_register_duplicate_email(self, api_client, employee_user):
        payload = {
            "email": employee_user.email,
            "first_name": "Dup",
            "last_name": "User",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    url = "/api/auth/login/"

    def test_login_success(self, api_client, employee_user):
        response = api_client.post(
            self.url,
            {"email": employee_user.email, "password": "TestPass123!"},
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data
        assert "user" in response.data

    def test_login_wrong_password(self, api_client, employee_user):
        response = api_client.post(
            self.url,
            {"email": employee_user.email, "password": "WrongPassword!"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post(
            self.url,
            {"email": "ghost@nobody.com", "password": "Whatever123!"},
        )
        assert response.status_code == 401


@pytest.mark.django_db
class TestMe:
    url = "/api/auth/me/"

    def test_me_returns_user(self, auth_client, employee_user):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.data["email"] == employee_user.email
        assert response.data["role"] == "EMPLOYEE"

    def test_me_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401
