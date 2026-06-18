from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BurnoutScore
from .serializers import BurnoutCalculateSerializer, BurnoutScoreSerializer
from .services import BurnoutService

User = get_user_model()


class BurnoutViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET  /api/burnout/          — list burnout scores
    POST /api/burnout/calculate/ — trigger calculation
    """

    serializer_class = BurnoutScoreSerializer
    permission_classes = [IsAuthenticated]
    ordering_fields = ["calculated_at", "score", "risk_level"]

    def get_queryset(self):
        user = self.request.user
        qs = BurnoutScore.objects.select_related("employee")
        if user.role == "EMPLOYEE":
            # Employees see only their own latest score
            return qs.filter(employee=user)
        return qs.all()

    @action(detail=False, methods=["post"])
    def calculate(self, request):
        """POST /api/burnout/calculate/, calculate burnout for employee."""
        serializer = BurnoutCalculateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee_id = serializer.validated_data.get("employee_id")
        if employee_id and request.user.role != "EMPLOYEE":
            try:
                employee = User.objects.get(id=employee_id, is_active=True)
            except User.DoesNotExist:
                return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            employee = request.user

        score = BurnoutService.calculate_for_employee(employee)
        return Response(BurnoutScoreSerializer(score).data, status=status.HTTP_201_CREATED)
