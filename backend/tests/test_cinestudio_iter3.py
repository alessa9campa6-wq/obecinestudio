# CineStudio iteration 3: project 'client' + type fields persistence, library PUT/DELETE 404s
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")


@pytest.fixture(scope="module")
def tok():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123", "name": "TEST_I3"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['session_token']}"}


# Project client field (Social type)
class TestProjectClient:
    def test_create_social_with_client_and_update(self, tok):
        r = requests.post(f"{BASE_URL}/api/projects", json={"title": "TEST_Social", "type": "social", "client": "TEST_Acme"}, headers=tok)
        assert r.status_code in (200, 201), r.text
        p = r.json()
        assert "_id" not in p
        assert p.get("client") == "TEST_Acme"
        pid = p["id"]
        g = requests.get(f"{BASE_URL}/api/projects/{pid}", headers=tok).json()
        assert g["client"] == "TEST_Acme"
        assert g["type"] == "social"
        body = {k: g[k] for k in g if k in ("title", "type", "logline", "genre", "format", "client", "status")}
        body["client"] = "TEST_Beta"
        u = requests.put(f"{BASE_URL}/api/projects/{pid}", json=body, headers=tok)
        assert u.status_code == 200, u.text
        g2 = requests.get(f"{BASE_URL}/api/projects/{pid}", headers=tok).json()
        assert g2["client"] == "TEST_Beta"
        d = requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=tok)
        assert d.status_code == 200
        assert requests.get(f"{BASE_URL}/api/projects/{pid}", headers=tok).status_code == 404


# Library edge cases
class TestLibraryEdges:
    def test_put_delete_unknown_404(self, tok):
        assert requests.put(f"{BASE_URL}/api/library/nope", json={"title": "x"}, headers=tok).status_code == 404
        assert requests.delete(f"{BASE_URL}/api/library/nope", headers=tok).status_code == 404

    def test_bulk_then_get_no_objectid(self, tok):
        r = requests.post(f"{BASE_URL}/api/library/bulk", json={"kind": "lens", "items": [{"title": "TEST_50mm", "data": {"focal": 50}}]}, headers=tok)
        assert r.status_code == 200 and r.json()["added"] == 1
        lst = requests.get(f"{BASE_URL}/api/library?kind=lens", headers=tok).json()
        it = [x for x in lst if x["title"] == "TEST_50mm"][0]
        assert "_id" not in it and it["data"]["focal"] == 50
        assert requests.delete(f"{BASE_URL}/api/library/{it['id']}", headers=tok).status_code == 200
