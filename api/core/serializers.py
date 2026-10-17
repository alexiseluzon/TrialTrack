from rest_framework import serializers

from .models import Site, Sponsor, Trial
from .permissions import can_modify


class SponsorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sponsor
        fields = ["id", "name", "country"]


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ["id", "name", "city", "country"]


class TrialListSerializer(serializers.ModelSerializer):
    sponsor_name = serializers.CharField(source="sponsor.name", read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Trial
        fields = ["id", "code", "title", "condition", "phase", "status",
                  "sponsor", "sponsor_name", "start_date", "enrollment", "can_edit"]
        extra_kwargs = {"enrollment": {"max_value": 1_000_000}}

    def get_can_edit(self, obj):
        request = self.context.get("request")
        return bool(request and can_modify(request.user, obj))


class TrialDetailSerializer(TrialListSerializer):
    sites = SiteSerializer(many=True, read_only=True)

    class Meta(TrialListSerializer.Meta):
        fields = TrialListSerializer.Meta.fields + ["sites", "created_at"]