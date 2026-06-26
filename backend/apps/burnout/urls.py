from rest_framework.routers import DefaultRouter

from .views import BurnoutViewSet

router = DefaultRouter()
router.register(r"", BurnoutViewSet, basename="burnout")
urlpatterns = router.urls
