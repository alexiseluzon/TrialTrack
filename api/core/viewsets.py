from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .filters import TrialFilter
from .models import Sponsor, Trial
from .permissions import IsAdminOrReadOnly
from .serializers import SponsorSerializer, TrialDetailSerializer, TrialListSerializer


class Pagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class TrialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = Pagination
    filterset_class = TrialFilter
    search_fields = ["code", "title", "condition", "sponsor__name"]
    ordering_fields = ["code", "title", "phase", "status", "start_date", "enrollment"]

    def get_queryset(self):
        qs = Trial.objects.select_related("sponsor")
        if self.action != "list":
            qs = qs.prefetch_related("sites")
        return qs

    def get_serializer_class(self):
        return TrialListSerializer if self.action == "list" else TrialDetailSerializer


class SponsorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sponsor.objects.all()
    serializer_class = SponsorSerializer
    pagination_class = Pagination


class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class RefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

@api_view(["GET"])
def me(request):
    user = request.user
    return Response({"username": user.get_username(), "is_staff": user.is_staff})