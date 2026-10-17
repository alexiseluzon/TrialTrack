from datetime import date

import strawberry
import strawberry_django
from django.conf import settings
from django.db.models import Q
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from graphql import NoSchemaIntrospectionCustomRule
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.throttling import UserRateThrottle
from rest_framework_simplejwt.authentication import JWTAuthentication
from strawberry.django.views import GraphQLView
from strawberry.extensions import (
    AddValidationRules,
    MaxAliasesLimiter,
    MaxTokensLimiter,
    QueryDepthLimiter,
)
from strawberry.permission import BasePermission

from .models import Site, Sponsor, Trial

MAX_LIMIT = 100
ORDER_FIELDS = {"code", "title", "phase", "status", "start_date", "enrollment"}


class IsAuthenticated(BasePermission):
    message = "Authentication required"

    def has_permission(self, source, info, **kwargs):
        return bool(info.context.request.user.is_authenticated)


@strawberry_django.type(Sponsor)
class SponsorType:
    id: int
    name: str
    country: str


@strawberry_django.type(Site)
class SiteType:
    id: int
    name: str
    city: str
    country: str


@strawberry_django.type(Trial)
class TrialType:
    id: int
    code: str
    title: str
    condition: str
    phase: str
    status: str
    start_date: date
    enrollment: int
    sponsor: SponsorType
    sites: list[SiteType]


@strawberry.type
class TrialPage:
    total: int
    items: list[TrialType]


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def trials(
        self,
        search: str | None = None,
        phase: str | None = None,
        status: str | None = None,
        order_by: str = "-start_date",
        limit: int = 20,
        offset: int = 0,
    ) -> TrialPage:
        qs = Trial.objects.select_related("sponsor").prefetch_related("sites")
        if search:
            qs = qs.filter(
                Q(code__icontains=search)
                | Q(title__icontains=search)
                | Q(condition__icontains=search)
                | Q(sponsor__name__icontains=search)
            )
        if phase:
            qs = qs.filter(phase=phase)
        if status:
            qs = qs.filter(status=status)
        if order_by.lstrip("-") not in ORDER_FIELDS:  # allowlist, never raw input
            order_by = "-start_date"
        qs = qs.order_by(order_by, "id")
        limit = max(1, min(limit, MAX_LIMIT))
        offset = max(0, offset)
        return TrialPage(total=qs.count(), items=list(qs[offset : offset + limit]))

    @strawberry.field(permission_classes=[IsAuthenticated])
    def trial(self, code: str) -> TrialType | None:
        qs = Trial.objects.select_related("sponsor").prefetch_related("sites")
        return qs.filter(code=code).first()

    @strawberry.field(permission_classes=[IsAuthenticated])
    def sponsors(self) -> list[SponsorType]:
        return list(Sponsor.objects.all())


extensions = [
    lambda: QueryDepthLimiter(max_depth=5),
    lambda: MaxAliasesLimiter(max_alias_count=15),
    lambda: MaxTokensLimiter(max_token_count=1000),
]
if not settings.DEBUG:
    extensions.append(lambda: AddValidationRules([NoSchemaIntrospectionCustomRule]))

schema = strawberry.Schema(query=Query, extensions=extensions)


@method_decorator(csrf_exempt, name="dispatch")  # bearer header auth, no cookies
class JWTGraphQLView(GraphQLView):
    """JWT auth + per-user throttling in front of GraphQL."""

    def dispatch(self, request, *args, **kwargs):
        try:
            auth = JWTAuthentication().authenticate(request)
        except AuthenticationFailed:
            return JsonResponse({"errors": [{"message": "Invalid or expired token"}]}, status=401)
        if auth:
            request.user = auth[0]
        if not UserRateThrottle().allow_request(request, self):
            return JsonResponse({"errors": [{"message": "Rate limit exceeded"}]}, status=429)
        return super().dispatch(request, *args, **kwargs)