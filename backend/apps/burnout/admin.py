from django.contrib import admin

from .models import BurnoutScore


@admin.register(BurnoutScore)
class BurnoutScoreAdmin(admin.ModelAdmin):
    list_display = ["employee", "score", "risk_level", "calculated_at"]
    list_filter = ["risk_level"]
    search_fields = ["employee__email"]
    ordering = ["-calculated_at"]
