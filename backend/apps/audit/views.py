from rest_framework import viewsets

from apps.users.permissions import IsAdmin

from .filters import AuditLogFilter
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/audit/       — list audit logs (ADMIN only, paginated)
    GET /api/audit/{id}/  — retrieve single log entry
    """

    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filterset_class = AuditLogFilter
    search_fields = ["action", "actor_email", "path"]
    ordering_fields = ["timestamp", "category", "status"]
    ordering = ["-timestamp"]
