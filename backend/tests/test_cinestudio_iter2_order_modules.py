import os
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
ADMIN = {"email": "admin@cinestudio.app", "password": "CineStudio2026!"}


@pytest.fixture(scope="module")
def h():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.skip("login failed")
    return {"Authorization": f"Bearer {r.json()['session_token']}"}


# Project modules[] + client fields, item order update persistence
def test_project_modules_and_item_order(h):
    p = requests.post(f"{BASE_URL}/api/projects", json={"title": "TEST_ord", "type": "film", "client": "TEST_C", "modules": ["song"]}, headers=h)
    assert p.status_code == 200, p.text
    pid = p.json()["id"]
    try:
        g = requests.get(f"{BASE_URL}/api/projects/{pid}", headers=h).json()
        assert g.get("client") == "TEST_C"
        assert g.get("modules") == ["song"]
        u = requests.put(f"{BASE_URL}/api/projects/{pid}", json={**g, "modules": ["song", "bible"]}, headers=h)
        assert u.status_code == 200
        assert requests.get(f"{BASE_URL}/api/projects/{pid}", headers=h).json()["modules"] == ["song", "bible"]
        a = requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "scenes", "title": "TEST_A"}, headers=h).json()
        b = requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "scenes", "title": "TEST_B"}, headers=h).json()
        assert a["order"] < b["order"]
        r = requests.put(f"{BASE_URL}/api/items/{b['id']}", json={"order": a["order"] - 1}, headers=h)
        assert r.status_code == 200 and r.json()["order"] == a["order"] - 1
        assert r.json()["title"] == "TEST_B"
        lst = requests.get(f"{BASE_URL}/api/projects/{pid}/items?module=scenes", headers=h).json()
        assert [x["title"] for x in lst] == ["TEST_B", "TEST_A"]
    finally:
        requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=h)
