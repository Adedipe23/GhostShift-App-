"""GhostShift URL configuration."""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # API Schema & Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    # Auth
    path("api/auth/", include("apps.users.urls")),

    # Resources
    path("api/departments/", include("apps.departments.urls")),
    path("api/shifts/", include("apps.shifts.urls")),
    path("api/availability/", include("apps.availability.urls")),
    path("api/swaps/", include("apps.swaps.urls")),
    path("api/burnout/", include("apps.burnout.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/audit/", include("apps.audit.urls")),
]
