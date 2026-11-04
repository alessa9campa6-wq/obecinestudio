# CineStudio backend edge-case tests: validation, 404s, auth errors, cascade delete
import os
import io
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
ADMIN = {"email": "admin@cinestudio.app", "password": "CineStudio2026!"}


def H(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="module")
def tok():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert r.status_code == 200
    return r.json()["session_token"]


# Auth validation
def test_register_invalid_email():
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": "notanemail", "password": "secret123"})
    assert r.status_code == 422


def test_login_case_insensitive_email():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "  ADMIN@CineStudio.app ", "password": ADMIN["password"]})
    assert r.status_code == 200 and r.json()["user"]["role"] == "admin"


def test_invalid_bearer_token():
    assert requests.get(f"{BASE_URL}/api/auth/me", headers=H("garbage")).status_code == 401


def test_upload_no_auth():
    r = requests.post(f"{BASE_URL}/api/upload", files={"file": ("x.png", io.BytesIO(b"x"), "image/png")})
    assert r.status_code == 401


# Projects / items validation and 404s
def test_create_project_missing_title(tok):
    assert requests.post(f"{BASE_URL}/api/projects", json={"genre": "x"}, headers=H(tok)).status_code == 422


def test_unknown_project_and_item_404(tok):
    fake = str(uuid.uuid4())
    assert requests.get(f"{BASE_URL}/api/projects/{fake}/summary", headers=H(tok)).status_code == 404
    assert requests.put(f"{BASE_URL}/api/items/{fake}", json={"title": "x"}, headers=H(tok)).status_code == 404
    assert requests.delete(f"{BASE_URL}/api/projects/{fake}", headers=H(tok)).status_code == 404


def test_item_missing_module_and_cascade_delete(tok):
    p = requests.post(f"{BASE_URL}/api/projects", json={"title": "TEST_Edge"}, headers=H(tok)).json()
    pid = p["id"]
    try:
        assert requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"title": "x"}, headers=H(tok)).status_code == 422
        it = requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "screenplay", "title": "TEST_SP", "data": {"elements": [{"type": "scene", "text": "INT."}]}}, headers=H(tok)).json()
        g = requests.get(f"{BASE_URL}/api/projects/{pid}/items?module=screenplay", headers=H(tok)).json()
        assert g[0]["data"]["elements"][0]["text"] == "INT."
        assert requests.get(f"{BASE_URL}/api/projects/{pid}/items?module=none", headers=H(tok)).json() == []
    finally:
        assert requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=H(tok)).status_code == 200
    # cascade: item gone
    assert requests.put(f"{BASE_URL}/api/items/{it['id']}", json={"title": "y"}, headers=H(tok)).status_code == 404
