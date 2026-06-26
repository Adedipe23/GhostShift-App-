from django.contrib import admin

from .models import SwapRequest


@admin.register(SwapRequest)
class SwapRequestAdmin(admin.ModelAdmin):
    list_display = ["requester", "shift", "replacement_employee", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["requester__email", "replacement_employee__email"]
