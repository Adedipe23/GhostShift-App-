import django_filters

from .models import Shift


class ShiftFilter(django_filters.FilterSet):
    department = django_filters.UUIDFilter(field_name="department__id")
    assigned_employee = django_filters.UUIDFilter(field_name="assigned_employee__id")
    status = django_filters.CharFilter(field_name="status")
    start_after = django_filters.DateTimeFilter(field_name="start_time", lookup_expr="gte")
    start_before = django_filters.DateTimeFilter(field_name="start_time", lookup_expr="lte")

    class Meta:
        model = Shift
        fields = ["department", "assigned_employee", "status"]