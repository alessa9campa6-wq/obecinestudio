# CineStudio iteration 2: lens library (user-wide) CRUD + ownership, register 409, budget/ref items persistence
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
ADMIN = {"email": "admin@cinestudio.app", "password": "CineStudio2026!"}


def H(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="module")
def admin():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert r.status_code == 200
    return r.json()["session_token"]


@pytest.fixture(scope="module")
def other():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123", "name": "TEST_U"})
    assert r.status_code == 200
    return r.json()["session_token"]


class TestRegister:
    def test_register_existing_admin_409(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": ADMIN["email"], "password": "whatever1"})
        assert r.status_code == 409
        assert "registrata" in r.json()["detail"]

    def test_register_short_password_422(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": f"test_{uuid.uuid4().hex[:6]}@x.com", "password": "12"})
        assert r.status_code == 422


class TestLibrary:
    def test_list_requires_kind(self, admin):
        assert requests.get(f"{BASE_URL}/api/library", headers=H(admin)).status_code == 422

    def test_list_requires_auth(self):
        assert requests.get(f"{BASE_URL}/api/library?kind=lens").status_code == 401

    def test_admin_existing_lens(self, admin):
        r = requests.get(f"{BASE_URL}/api/library?kind=lens", headers=H(admin))
        assert r.status_code == 200
        assert all("_id" not in x and "owner_id" not in x for x in r.json())

    def test_bulk_crud_and_isolation(self, admin, other):
        tag = uuid.uuid4().hex[:6]
        items = [{"title": f"TEST_{tag}_25mm", "data": {"focal": 25, "series": "TEST"}},
                 {"title": f"TEST_{tag}_50mm", "data": {"focal": 50, "series": "TEST"}}]
        r = requests.post(f"{BASE_URL}/api/library/bulk", headers=H(other), json={"kind": "lens", "items": items})
        assert r.status_code == 200 and r.json()["added"] == 2
        lst = requests.get(f"{BASE_URL}/api/library?kind=lens", headers=H(other)).json()
        mine = [x for x in lst if x["title"].startswith(f"TEST_{tag}")]
        assert len(mine) == 2 and mine[0]["data"]["focal"] == 25 and mine[0]["kind"] == "lens"
        lid = mine[0]["id"]
        # other kind not mixed
        assert not [x for x in requests.get(f"{BASE_URL}/api/library?kind=camera", headers=H(other)).json() if x["id"] == lid]
        # isolation: admin can't see/edit/delete
        adm = requests.get(f"{BASE_URL}/api/library?kind=lens", headers=H(admin)).json()
        assert not [x for x in adm if x["id"] == lid]
        assert requests.put(f"{BASE_URL}/api/library/{lid}", headers=H(admin), json={"title": "hack", "data": {}}).status_code == 404
        assert requests.delete(f"{BASE_URL}/api/library/{lid}", headers=H(admin)).status_code == 404
        # update -> get
        u = requests.put(f"{BASE_URL}/api/library/{lid}", headers=H(other), json={"title": f"TEST_{tag}_28mm", "data": {"focal": 28}})
        assert u.status_code == 200
        got = [x for x in requests.get(f"{BASE_URL}/api/library?kind=lens", headers=H(other)).json() if x["id"] == lid][0]
        assert got["title"] == f"TEST_{tag}_28mm" and got["data"]["focal"] == 28
        # delete -> gone
        for x in mine:
            assert requests.delete(f"{BASE_URL}/api/library/{x['id']}", headers=H(other)).status_code == 200
        assert requests.delete(f"{BASE_URL}/api/library/{lid}", headers=H(other)).status_code == 404
        left = requests.get(f"{BASE_URL}/api/library?kind=lens", headers=H(other)).json()
        assert not [x for x in left if x["title"].startswith(f"TEST_{tag}")]

    def test_bulk_empty(self, other):
        r = requests.post(f"{BASE_URL}/api/library/bulk", headers=H(other), json={"kind": "lens", "items": []})
        assert r.status_code == 200 and r.json()["added"] == 0


class TestBudgetRefs:
    def test_budget_item_and_refs_persist(self, other):
        p = requests.post(f"{BASE_URL}/api/projects", headers=H(other), json={"title": "TEST_Iter2"}).json()
        pid = p["id"]
        try:
            loc = requests.post(f"{BASE_URL}/api/projects/{pid}/items", headers=H(other), json={"module": "locations", "title": "TEST_Loc", "data": {}}).json()
            sc = requests.post(f"{BASE_URL}/api/projects/{pid}/items", headers=H(other), json={"module": "scenes", "title": "TEST_Sc", "data": {"location": [loc["id"]]}}).json()
            b = requests.post(f"{BASE_URL}/api/projects/{pid}/items", headers=H(other), json={"module": "budget", "title": "TEST_B", "data": {"amount": 100, "unit": "giorno", "qty": 3}}).json()
            items = requests.get(f"{BASE_URL}/api/projects/{pid}/items", headers=H(other)).json()
            byid = {i["id"]: i for i in items}
            assert byid[sc["id"]]["data"]["location"] == [loc["id"]]
            assert byid[b["id"]]["data"]["qty"] == 3
        finally:
            requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=H(other))
