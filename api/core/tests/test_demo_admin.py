import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from core.models import Sponsor, Trial
from core.permissions import DEMO_GROUP, DEMO_MAX_TRIALS

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


def make_user(name, staff=False, demo=False):
    user = get_user_model().objects.create_user(name, password=PW, is_staff=staff)
    if demo:
        group, _ = Group.objects.get_or_create(name=DEMO_GROUP)
        user.groups.add(group)
    return user


def make_trial(sponsor, **kw):
    data = dict(code="TT-1", title="T", condition="Asthma", phase="P1", status="active",
                start_date="2024-01-01", enrollment=10, sponsor=sponsor)
    data.update(kw)
    return Trial.objects.create(**data)


def payload(sponsor, **kw):
    return {"code": "TT-100", "title": "New", "condition": "Asthma", "phase": "P1",
            "status": "active", "sponsor": sponsor.id, "start_date": "2024-01-01",
            "enrollment": 50, **kw}


def test_demo_admin_manages_own_trial(api, sponsor):
    user = make_user("demo_admin", staff=True, demo=True)
    api.force_authenticate(user)
    assert api.post("/api/trials/", payload(sponsor), format="json").status_code == 201
    trial = Trial.objects.get(code="TT-100")
    assert trial.created_by_id == user.id
    assert api.patch(f"/api/trials/{trial.id}/", {"title": "Edited"}, format="json").status_code == 200
    assert api.delete(f"/api/trials/{trial.id}/").status_code == 204


def test_demo_admin_cannot_touch_seeded_trials(api, sponsor):
    seeded = make_trial(sponsor)
    api.force_authenticate(make_user("demo_admin", staff=True, demo=True))
    assert api.patch(f"/api/trials/{seeded.id}/", {"title": "X"}, format="json").status_code == 403
    assert api.delete(f"/api/trials/{seeded.id}/").status_code == 403
    assert Trial.objects.filter(id=seeded.id, title="T").exists()


def test_demo_admin_creation_cap(api, sponsor):
    user = make_user("demo_admin", staff=True, demo=True)
    for i in range(DEMO_MAX_TRIALS):
        make_trial(sponsor, code=f"D-{i:03d}", created_by=user)
    api.force_authenticate(user)
    res = api.post("/api/trials/", payload(sponsor), format="json")
    assert res.status_code == 400
    assert "non_field_errors" in res.json()


def test_regular_staff_can_modify_any_trial(api, sponsor):
    seeded = make_trial(sponsor)
    api.force_authenticate(make_user("boss", staff=True))
    assert api.patch(f"/api/trials/{seeded.id}/", {"title": "Edited"}, format="json").status_code == 200


def test_can_edit_flag_in_list(api, sponsor):
    user = make_user("demo_admin", staff=True, demo=True)
    make_trial(sponsor, code="SEED-1")
    make_trial(sponsor, code="MINE-1", created_by=user)
    api.force_authenticate(user)
    flags = {t["code"]: t["can_edit"] for t in api.get("/api/trials/").json()["results"]}
    assert flags == {"SEED-1": False, "MINE-1": True}

    api.force_authenticate(make_user("viewer"))
    flags = {t["code"]: t["can_edit"] for t in api.get("/api/trials/").json()["results"]}
    assert not any(flags.values())