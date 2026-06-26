from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsManagerOrAbove

from .models import SwapRequest, SwapStatus
from .serializers import SwapApprovalSerializer, SwapRequestSerializer
from .services import SwapService


class SwapRequestViewSet(viewsets.ModelViewSet):
    """
    Shift swap request workflow.

    Employees can create; managers can approve/reject.
    """

    serializer_class = SwapRequestSerializer
    http_method_names = ["get", "post", "put", "head", "options"]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "requester", "shift"]

    def get_queryset(self):
        user = self.request.user
        qs = SwapRequest.objects.select_related(
            "requester", "shift", "replacement_employee", "reviewed_by"
        )
        if user.role == "EMPLOYEE":
            return qs.filter(requester=user) | qs.filter(replacement_employee=user)
        return qs.all()

    def perform_create(self, serializer):
        shift = serializer.validated_data["shift"]
        replacement = serializer.validated_data["replacement_employee"]
        SwapService.validate_swap(self.request.user, shift, replacement)
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=["put"], permission_classes=[IsManagerOrAbove])
    def approve(self, request, pk=None):
        """PUT /api/swaps/{id}/approve/ — approve the swap request."""
        swap = self.get_object()
        if swap.status != SwapStatus.PENDING:
            return Response(
                {"detail": "Only PENDING requests can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = SwapApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Reassign shift to replacement employee
        shift = swap.shift
        shift.assigned_employee = swap.replacement_employee
        shift.save(update_fields=["assigned_employee"])

        swap.status = SwapStatus.APPROVED
        swap.reviewed_by = request.user
        swap.manager_comment = serializer.validated_data.get("manager_comment", "")
        swap.save()
        return Response(SwapRequestSerializer(swap).data)

    @action(detail=True, methods=["put"], permission_classes=[IsManagerOrAbove])
    def reject(self, request, pk=None):
        """PUT /api/swaps/{id}/reject/ — reject the swap request."""
        swap = self.get_object()
        if swap.status != SwapStatus.PENDING:
            return Response(
                {"detail": "Only PENDING requests can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = SwapApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        swap.status = SwapStatus.REJECTED
        swap.reviewed_by = request.user
        swap.manager_comment = serializer.validated_data.get("manager_comment", "")
        swap.save()
        return Response(SwapRequestSerializer(swap).data)
