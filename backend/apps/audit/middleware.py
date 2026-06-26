"""
AuditLog middleware — automatically records every meaningful API request.

Skipped paths: /api/schema/, /api/docs/, /admin/, /static/, /media/
Only POST / PUT / PATCH / DELETE are logged (reads produce too much noise).
GET /api/auth/login/ is also captured as an AUTH event.
"""

import logging

from .models import AuditLog

logger = logging.getLogger(__name__)

# Paths that generate too much noise — skip entirely
_SKIP_PREFIXES = (
    "/api/schema",
    "/api/docs",
    "/admin/",
    "/static/",
    "/media/",
)

# Map URL path fragments → AuditLog category
_CATEGORY_MAP = {
    "/api/auth/": AuditLog.Category.AUTH,
    "/api/auth/users/": AuditLog.Category.USERS,
    "/api/shifts/": AuditLog.Category.SHIFTS,
    "/api/swaps/": AuditLog.Category.SWAPS,
    "/api/attendance/": AuditLog.Category.ATTENDANCE,
    "/api/departments/": AuditLog.Category.DEPARTMENTS,
    "/api/availability/": AuditLog.Category.AVAILABILITY,
    "/api/notifications/": AuditLog.Category.NOTIFICATIONS,
    "/api/burnout/": AuditLog.Category.SYSTEM,
    "/api/analytics/": AuditLog.Category.SYSTEM,
}


def _get_category(path: str) -> str:
    """Return the most-specific matching category."""
    # Longest prefix wins
    best = AuditLog.Category.SYSTEM
    best_len = 0
    for prefix, cat in _CATEGORY_MAP.items():
        if path.startswith(prefix) and len(prefix) > best_len:
            best = cat
            best_len = len(prefix)
    return best


def _get_action(method: str, path: str, response_status: int, user) -> str:
    """Build a human-readable action description."""
    parts = [p for p in path.strip("/").split("/") if p]

    # Special cases
    if "/auth/login/" in path:
        if response_status < 300:
            return f"User signed in: {getattr(user, 'email', 'unknown')}"
        return "Failed login attempt"

    if "/auth/logout/" in path:
        return f"User signed out: {getattr(user, 'email', 'unknown')}"

    if "/auth/register/" in path:
        return "New user account registered"

    if "/auth/me/" in path:
        return "User profile updated"

    if "/auth/users/" in path:
        if method == "POST":
            return "Admin created new user account"
        if method in ("PUT", "PATCH"):
            return "Admin updated user account"
        if method == "DELETE":
            return "Admin deleted user account"

    # Generic action from method + resource name
    resource = parts[-1] if parts else "resource"
    # Strip UUIDs / IDs
    if len(resource) > 30 or resource.isdigit():
        resource = parts[-2] if len(parts) > 1 else "record"

    verb_map = {
        "POST": "Created",
        "PUT": "Updated",
        "PATCH": "Updated",
        "DELETE": "Deleted",
        "GET": "Viewed",
    }
    verb = verb_map.get(method, method)
    return f"{verb} {resource.replace('-', ' ').replace('_', ' ').title()}"


def _get_status(response_status: int) -> str:
    if response_status < 300:
        return AuditLog.Status.SUCCESS
    if response_status < 500:
        return AuditLog.Status.WARNING
    return AuditLog.Status.ERROR


def _get_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class AuditLogMiddleware:
    """WSGI middleware that logs meaningful API write operations."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        try:
            self._maybe_log(request, response)
        except Exception:
            logger.exception("AuditLogMiddleware failed silently")

        return response

    def _maybe_log(self, request, response):
        path = request.path

        # Skip noisy / non-API paths
        if any(path.startswith(p) for p in _SKIP_PREFIXES):
            return

        method = request.method.upper()

        # Only log writes + login
        is_login = "/auth/login/" in path and method == "POST"
        if method not in ("POST", "PUT", "PATCH", "DELETE") and not is_login:
            return

        # Don't log token refresh noise
        if "/auth/refresh/" in path:
            return

        status_code = response.status_code
        user = getattr(request, "user", None)
        actor = user if user and user.is_authenticated else None
        actor_email = getattr(actor, "email", "") or ""

        action = _get_action(method, path, status_code, actor)
        category = _get_category(path)
        log_status = _get_status(status_code)

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor_email,
            action=action,
            category=category,
            status=log_status,
            method=method,
            path=path,
            ip_address=_get_ip(request),
            response_status=status_code,
        )
