import django_filters

from .models import Availability


class AvailabilityFilter(django_filters.FilterSet):
    employee = django_filters.UUIDFilter(field_name="employee__id")
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Availability
        fields = ["employee", "available"]
