from rest_framework.routers import DefaultRouter

from .views import ShiftViewSet

router = DefaultRouter()
router.register(r"", ShiftViewSet, basename="shifts")
urlpatterns = router.urls
