from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "actor_email", "category", "action", "status", "response_status", "ip_address"]
    list_filter = ["category", "status"]
    search_fields = ["actor_email", "action", "path"]
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    ordering = ["-timestamp"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
