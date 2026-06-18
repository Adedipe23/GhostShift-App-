from rest_framework.routers import DefaultRouter

from .views import AvailabilityViewSet

router = DefaultRouter()
router.register(r"", AvailabilityViewSet, basename="availability")
urlpatterns = router.urls
