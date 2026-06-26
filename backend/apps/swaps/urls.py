from rest_framework.routers import DefaultRouter

from .views import SwapRequestViewSet

router = DefaultRouter()
router.register(r"", SwapRequestViewSet, basename="swaps")
urlpatterns = router.urls
