import pytest


@pytest.mark.django_db
def test_health_ok(client):
    res = client.get("/health/", secure=True)
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_health_rejects_post(client):
    assert client.post("/health/", secure=True).status_code == 405