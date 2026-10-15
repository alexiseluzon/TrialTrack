import django_filters

from .models import Trial


class TrialFilter(django_filters.FilterSet):
    start_after = django_filters.DateFilter(field_name="start_date", lookup_expr="gte")
    start_before = django_filters.DateFilter(field_name="start_date", lookup_expr="lte")

    class Meta:
        model = Trial
        fields = ["phase", "status", "sponsor", "condition"]