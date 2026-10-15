import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from core.models import Sponsor, Trial

pytestmark = pytest.mark.django_db
PW = "pw-12345-test"


@pytest.fixture
def api():
    c = APIClient()
    c.defaults["wsgi.url_scheme"] = "https"
    return c


@pytest.fixture
def sponsor():
    return Sponsor.objects.create(name="Acme", country="USA")


def make_user(name, staff=False):
    return get_user_model().objects.create_user(name, password=PW, is_staff=staff)


def make_trial(sponsor, **kw):
    data = dict(code="TT-1", title="T", condition="Asthma", phase="P1",
                status="active", start_date="2024-01-01", enrollment=10, sponsor=sponsor)
    data.update(kw)
    return Trial.objects.create(**data)


def payload(sponsor, **kw):
    return {"code": "TT-100", "title": "New", "condition": "Asthma", "phase": "P1",
            "status": "active", "sponsor": sponsor.id, "start_date": "2024-01-01",
            "enrollment": 50, **kw}


def test_requires_auth(api):
    assert api.get("/api/trials/").status_code == 401


def test_login_returns_tokens(api):
    make_user("u")
    res = api.post("/api/auth/token/", {"username": "u", "password": PW}, format="json")
    assert res.status_code == 200 and "access" in res.json()


def test_filter_and_search(api, sponsor):
    make_trial(sponsor, code="TT-1", phase="P1")
    make_trial(sponsor, code="TT-2", phase="P2", title="Insulin study")
    api.force_authenticate(make_user("u"))
    assert api.get("/api/trials/?phase=P2").json()["count"] == 1
    assert api.get("/api/trials/?search=insulin").json()["count"] == 1


def test_non_staff_cannot_write(api, sponsor):
    api.force_authenticate(make_user("u"))
    assert api.post("/api/trials/", payload(sponsor), format="json").status_code == 403


def test_staff_create_and_validation(api, sponsor):
    api.force_authenticate(make_user("admin", staff=True))
    assert api.post("/api/trials/", payload(sponsor), format="json").status_code == 201
    bad = api.post("/api/trials/", payload(sponsor, code="TT-101", enrollment=-5), format="json")
    assert bad.status_code == 400