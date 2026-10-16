from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import SimpleRouter
from django.conf import settings
from core.graphql_api import JWTGraphQLView, schema

from core.views import health
from core.viewsets import LoginView, RefreshView, SponsorViewSet, TrialViewSet, me

router = SimpleRouter()
router.register("trials", TrialViewSet, basename="trial")
router.register("sponsors", SponsorViewSet, basename="sponsor")

urlpatterns = [
    path("api/me/", me),
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/auth/token/", LoginView.as_view()),
    path("api/auth/refresh/", RefreshView.as_view()),
    path("api/", include(router.urls)),
    path("graphql/", JWTGraphQLView.as_view(
        schema=schema,
        graphql_ide="graphiql" if settings.DEBUG else None,
    )),
]