"""Custom DRF permissions for role-based access control."""

from rest_framework.permissions import BasePermission

from .models import UserRole


class IsManagerOrAbove(BasePermission):
    """Allow access only to MANAGER, HR, or ADMIN users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.MANAGER, UserRole.HR, UserRole.ADMIN)
        )


class IsHROrAdmin(BasePermission):
    """Allow access only to HR or ADMIN users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.HR, UserRole.ADMIN)
        )


class IsAdmin(BasePermission):
    """Allow access only to ADMIN users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsOwnerOrManagerAbove(BasePermission):
    """Allow owners of an object, or MANAGER/HR/ADMIN users."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in (UserRole.MANAGER, UserRole.HR, UserRole.ADMIN):
            return True
        # obj must have a user / employee / requester attribute
        owner = getattr(obj, "user", None) or getattr(obj, "employee", None) or getattr(obj, "requester", None)
        return owner == request.user
