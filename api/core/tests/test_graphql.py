import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from core.models import Sponsor, Trial

pytestmark = pytest.mark.django_db

LIST_Q = "{ trials(limit: 5) { total items { code sponsor { name } sites { city } } } }"


@pytest.fixture
def api():
    c = APIClient()
    c.defaults["wsgi.url_scheme"] = "https"
    return c


@pytest.fixture
def token():
    user = get_user_model().objects.create_user("u", password="pw-12345-test")
    return str(AccessToken.for_user(user))


def post(api, query, token=None):
    extra = {"HTTP_AUTHORIZATION": f"Bearer {token}"} if token else {}
    return api.post("/graphql/", {"query": query}, format="json", **extra)


def test_requires_auth(api):
    body = post(api, LIST_Q).json()
    assert body["errors"][0]["message"] == "Authentication required"


def test_invalid_token_rejected(api):
    assert post(api, LIST_Q, "garbage").status_code == 401


def test_list_trials(api, token):
    s = Sponsor.objects.create(name="Acme", country="USA")
    Trial.objects.create(code="TT-1", title="T", condition="Asthma", phase="P1",
                         status="active", start_date="2024-01-01", enrollment=10, sponsor=s)
    data = post(api, LIST_Q, token).json()["data"]["trials"]
    assert data["total"] == 1
    assert data["items"][0]["sponsor"]["name"] == "Acme"


def test_alias_limit(api, token):
    q = "{ " + " ".join(f"a{i}: sponsors {{ id }}" for i in range(20)) + " }"
    assert "errors" in post(api, q, token).json()