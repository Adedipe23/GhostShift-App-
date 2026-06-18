from django.contrib import admin

from .models import Shift


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ["title", "department", "assigned_employee", "start_time", "end_time", "status"]
    list_filter = ["status", "department"]
    search_fields = ["title", "assigned_employee__email"]
    ordering = ["start_time"]
