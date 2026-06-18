from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read serializer for User — used in responses."""

    full_name = serializers.ReadOnlyField()
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "department",
            "department_name",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None


class RegisterSerializer(serializers.ModelSerializer):
    """Write serializer for user registration."""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True, required=True, label="Confirm password")

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "password",
            "confirm_password",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(TokenObtainPairSerializer):
    """JWT login serializer — returns access + refresh tokens plus user data."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating the current user's profile."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "department",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "date_joined"]
