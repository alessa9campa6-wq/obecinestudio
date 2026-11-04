# CineStudio backend regression tests: auth, projects, items, upload/files
import os
import uuid
import io
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")).rstrip("/")
ADMIN = {"email": "admin@cinestudio.app", "password": "CineStudio2026!"}

# 1x1 PNG
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d4944415478da63f8cfc0f01f0005000201a5b1d6a90000000049454e44ae426082"
)


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    return r.json()["session_token"]


@pytest.fixture(scope="module")
def user2():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123", "name": "TEST_User2"})
    assert r.status_code == 200, r.text
    return {"email": email, "token": r.json()["session_token"], "user": r.json()["user"]}


def H(t):
    return {"Authorization": f"Bearer {t}"}


# --- Auth
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["email"] == ADMIN["email"] and d["user"]["role"] == "admin"
        assert isinstance(d["session_token"], str) and len(d["session_token"]) > 20
        assert "password_hash" not in d["user"]

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN["email"], "password": "nope"})
        assert r.status_code == 401

    def test_me(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=H(admin_token))
        assert r.status_code == 200 and r.json()["email"] == ADMIN["email"]

    def test_me_no_token(self):
        assert requests.get(f"{BASE_URL}/api/auth/me").status_code == 401

    def test_register_and_duplicate(self, user2):
        assert user2["user"]["email"] == user2["email"] and user2["user"]["role"] == "user"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": user2["email"].upper(), "password": "secret123"})
        assert r.status_code == 409

    def test_register_short_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": f"test_{uuid.uuid4().hex[:6]}@x.com", "password": "123"})
        assert r.status_code == 422

    def test_logout_invalidates(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        t = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123"}).json()["session_token"]
        assert requests.post(f"{BASE_URL}/api/auth/logout", headers=H(t)).status_code == 200
        assert requests.get(f"{BASE_URL}/api/auth/me", headers=H(t)).status_code == 401


# --- Projects + items
class TestProjectsItems:
    def test_full_crud_and_isolation(self, admin_token, user2):
        h = H(admin_token)
        r = requests.post(f"{BASE_URL}/api/projects", json={"title": "TEST_Proj", "genre": "drama"}, headers=h)
        assert r.status_code == 200
        p = r.json()
        pid = p["id"]
        try:
            assert p["title"] == "TEST_Proj" and p["status"] == "sviluppo" and "_id" not in p
            g = requests.get(f"{BASE_URL}/api/projects/{pid}", headers=h)
            assert g.status_code == 200 and g.json()["genre"] == "drama"
            assert any(x["id"] == pid for x in requests.get(f"{BASE_URL}/api/projects", headers=h).json())
            u = requests.put(f"{BASE_URL}/api/projects/{pid}", json={"title": "TEST_Proj2", "logline": "L"}, headers=h)
            assert u.status_code == 200 and u.json()["title"] == "TEST_Proj2"
            assert requests.get(f"{BASE_URL}/api/projects/{pid}", headers=h).json()["logline"] == "L"
            # isolation
            h2 = H(user2["token"])
            assert requests.get(f"{BASE_URL}/api/projects/{pid}", headers=h2).status_code == 404
            assert requests.put(f"{BASE_URL}/api/projects/{pid}", json={"title": "x"}, headers=h2).status_code == 404
            assert requests.get(f"{BASE_URL}/api/projects/{pid}/items", headers=h2).status_code == 404
            assert requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "cast"}, headers=h2).status_code == 404
            assert not any(x["id"] == pid for x in requests.get(f"{BASE_URL}/api/projects", headers=h2).json())
            # items
            i1 = requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "cast", "title": "TEST_A", "data": {"role": "lead"}}, headers=h).json()
            i2 = requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "cast", "title": "TEST_B"}, headers=h).json()
            requests.post(f"{BASE_URL}/api/projects/{pid}/items", json={"module": "budget", "title": "TEST_C", "data": {"amount": 100}}, headers=h)
            assert i2["order"] == i1["order"] + 1
            lst = requests.get(f"{BASE_URL}/api/projects/{pid}/items?module=cast", headers=h).json()
            assert [x["title"] for x in lst] == ["TEST_A", "TEST_B"] and lst[0]["data"]["role"] == "lead"
            assert "owner_id" not in lst[0] and "_id" not in lst[0]
            s = requests.get(f"{BASE_URL}/api/projects/{pid}/summary", headers=h).json()
            assert s == {"cast": 2, "budget": 1}
            up = requests.put(f"{BASE_URL}/api/items/{i1['id']}", json={"data": {"role": "sup"}}, headers=h)
            assert up.status_code == 200 and up.json()["data"]["role"] == "sup" and up.json()["title"] == "TEST_A"
            assert requests.put(f"{BASE_URL}/api/items/{i1['id']}", json={"title": "x"}, headers=h2).status_code == 404
            assert requests.delete(f"{BASE_URL}/api/items/{i1['id']}", headers=h2).status_code == 404
            assert requests.delete(f"{BASE_URL}/api/items/{i1['id']}", headers=h).status_code == 200
            lst = requests.get(f"{BASE_URL}/api/projects/{pid}/items?module=cast", headers=h).json()
            assert len(lst) == 1
            assert requests.delete(f"{BASE_URL}/api/items/{i1['id']}", headers=h).status_code == 404
        finally:
            assert requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=h).status_code == 200
        assert requests.get(f"{BASE_URL}/api/projects/{pid}", headers=h).status_code == 404

    def test_projects_no_auth(self):
        assert requests.get(f"{BASE_URL}/api/projects").status_code == 401


# --- Upload / files
class TestFiles:
    def test_upload_and_download(self, admin_token, user2):
        r = requests.post(f"{BASE_URL}/api/upload", headers=H(admin_token), files={"file": ("TEST_px.png", io.BytesIO(PNG), "image/png")})
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        g = requests.get(f"{BASE_URL}/api/files/{path}?token={admin_token}")
        assert g.status_code == 200 and g.content == PNG and g.headers["content-type"].startswith("image/png")
        assert requests.get(f"{BASE_URL}/api/files/{path}", headers=H(admin_token)).status_code == 200
        assert requests.get(f"{BASE_URL}/api/files/{path}?token={user2['token']}").status_code == 404
        assert requests.get(f"{BASE_URL}/api/files/{path}").status_code == 401
