from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TimeEntryViewSet

router = DefaultRouter()
router.register("time-entries", TimeEntryViewSet, basename="time-entries")

urlpatterns = [
    path("", include(router.urls)),
]
