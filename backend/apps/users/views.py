from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(APIView):
    """POST /api/auth/register/ — create a new user account."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Account created successfully.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — obtain JWT access + refresh tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklist the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class MeView(APIView):
    """GET /api/auth/me/ — return the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """PATCH /api/auth/me/ — partial update of current user profile."""
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RefreshTokenView(TokenRefreshView):
    """POST /api/auth/refresh/ — refresh the access token."""

    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD for Users. 
    Used by Managers/Admins to assign shifts, or by Admins to manage accounts.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Generate a temporary password if created by admin without one
        serializer.save()
