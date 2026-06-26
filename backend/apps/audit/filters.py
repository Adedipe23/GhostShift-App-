import django_filters

from .models import AuditLog


class AuditLogFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr="iexact")
    status = django_filters.CharFilter(lookup_expr="iexact")
    actor_email = django_filters.CharFilter(lookup_expr="icontains")
    from_date = django_filters.DateTimeFilter(field_name="timestamp", lookup_expr="gte")
    to_date = django_filters.DateTimeFilter(field_name="timestamp", lookup_expr="lte")

    class Meta:
        model = AuditLog
        fields = ["category", "status", "actor_email", "from_date", "to_date"]
