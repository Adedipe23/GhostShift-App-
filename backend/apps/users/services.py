from django.contrib.auth import get_user_model

User = get_user_model()


class UserService:
    """Business logic for user management."""

    @staticmethod
    def get_user_by_email(email: str):
        """Fetch a user by email address, returning None if not found."""
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    @staticmethod
    def deactivate_user(user_id: str) -> bool:
        """Deactivate a user account by ID."""
        updated = User.objects.filter(id=user_id).update(is_active=False)
        return updated > 0

    @staticmethod
    def get_employees_in_department(department_id: str):
        """Return all active employees in a given department."""
        return User.objects.filter(
            department_id=department_id,
            is_active=True,
            role="EMPLOYEE",
        )
