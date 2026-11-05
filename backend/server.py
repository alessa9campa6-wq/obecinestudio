import asyncio
import os
import logging
import secrets
import uuid
from contextlib import suppress
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Optional

import bcrypt
import httpx
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING, IndexModel
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

INDEXES: dict[str, list[IndexModel]] = {
    "users": [
        IndexModel([("email", ASCENDING)], name="email", unique=True),
        IndexModel([("user_id", ASCENDING)], name="user_id", unique=True),
    ],
    "user_sessions": [
        IndexModel([("session_token", ASCENDING)], name="session_token", unique=True),
        IndexModel([("user_id", ASCENDING)], name="user_id"),
        IndexModel([("expires_at", ASCENDING)], name="expires_ttl", expireAfterSeconds=0),
    ],
    "projects": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("updated_at", DESCENDING)], name="owner_updated"),
    ],
    "items": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("project_id", ASCENDING), ("module", ASCENDING), ("order", ASCENDING)], name="project_module"),
    ],
    "files": [IndexModel([("path", ASCENDING)], name="path", unique=True)],
    "library": [IndexModel([("owner_id", ASCENDING), ("kind", ASCENDING)], name="owner_kind"), IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "password_resets": [
    IndexModel([("email", ASCENDING)], name="email", unique=True),
    IndexModel([("expires_at", ASCENDING)], name="expires_ttl", expireAfterSeconds=0),
],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


# ---------------------------------------------------------------- storage
import mimetypes
import boto3
from botocore.config import Config

APP_NAME = os.environ.get("APP_NAME", "cinestudio")
STORAGE_DIR = (ROOT_DIR / "storage").resolve()

R2_ENDPOINT = os.environ.get("R2_ENDPOINT")
R2_BUCKET = os.environ.get("R2_BUCKET")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")

_s3_client = None


def init_storage() -> str:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    return str(STORAGE_DIR)


def local_object_path(path: str) -> Path:
    target = (STORAGE_DIR / path).resolve()
    if target == STORAGE_DIR or not target.is_relative_to(STORAGE_DIR):
        raise HTTPException(400, "Percorso file non valido")
    return target


def r2_enabled() -> bool:
    return bool(R2_ENDPOINT and R2_BUCKET and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)


def s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _s3_client


def put_object(path: str, data: bytes, content_type: str) -> dict:
    if r2_enabled():
        s3_client().put_object(
            Bucket=R2_BUCKET,
            Key=path,
            Body=data,
            ContentType=content_type,
        )
        return {"path": path}

    init_storage()
    target = local_object_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"path": path}


def get_object(path: str) -> tuple[bytes, str]:
    if r2_enabled():
        response = s3_client().get_object(Bucket=R2_BUCKET, Key=path)
        content_type = (
            response.get("ContentType")
            or mimetypes.guess_type(path)[0]
            or "application/octet-stream"
        )
        return response["Body"].read(), content_type

    target = local_object_path(path)
    if not target.is_file():
        raise HTTPException(404, "File non trovato")
    content_type = (
        mimetypes.guess_type(target.name)[0]
        or "application/octet-stream"
    )
    return target.read_bytes(), content_type

# ---------------------------------------------------------------- models
class User(BaseModel):
    user_id: str
    email: str
    name: str = ""
    picture: Optional[str] = None
    role: str = "user"
    profiles: list[str] = Field(default_factory=list)
    crew_role: str = ""
    view_mode: str = "filmmaker"


class ProfileIn(BaseModel):
    name: str = ""
    profiles: list[str] = Field(default_factory=list)
    crew_role: str = ""
    view_mode: str = "filmmaker"


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str = ""


class LoginIn(BaseModel):
    email: str
    password: str


class SessionIn(BaseModel):
    session_id: str
    

class ForgotIn(BaseModel):
    email: str


class ResetIn(BaseModel):
    email: str
    code: str
    password: str = Field(min_length=6)


class ProjectIn(BaseModel):
    title: str
    type: str = "film"
    logline: str = ""
    genre: str = ""
    status: str = "sviluppo"
    director: str = ""
    client: str = ""
    modules: list[str] = Field(default_factory=list)
    cover_path: Optional[str] = None


class Project(ProjectIn):
    id: str
    owner_id: str
    members: list[dict] = Field(default_factory=list)
    my_role: str = "owner"
    created_at: str
    updated_at: str


class MembersIn(BaseModel):
    members: list[dict]


class ItemIn(BaseModel):
    module: str
    title: str = ""
    data: dict[str, Any] = Field(default_factory=dict)
    order: Optional[float] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    order: Optional[float] = None


class Item(BaseModel):
    id: str
    project_id: str
    module: str
    title: str
    data: dict[str, Any]
    order: float
    created_at: str
    updated_at: str


# ---------------------------------------------------------------- auth helpers
def normalize(email: str) -> str:
    return email.strip().lower()


async def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({"session_token": token, "user_id": user_id, "expires_at": now() + timedelta(days=7), "created_at": now()})
    return token


def to_user(doc: dict) -> User:
    return User(
        user_id=doc["user_id"], email=doc["email"], name=doc.get("name", ""), picture=doc.get("picture"), role=doc.get("role", "user"),
        profiles=doc.get("profiles", []), crew_role=doc.get("crew_role", ""), view_mode=doc.get("view_mode", "filmmaker"),
    )


async def user_from_token(token: Optional[str]) -> User:
    if not token:
        raise HTTPException(401, "Non autenticato")
    s = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not s:
        raise HTTPException(401, "Sessione non valida")
    exp = s["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now():
        raise HTTPException(401, "Sessione scaduta")
    u = await db.users.find_one({"user_id": s["user_id"]}, {"_id": 0})
    if not u:
        raise HTTPException(401, "Utente non trovato")
    return to_user(u)


def bearer(request: Request) -> Optional[str]:
    h = request.headers.get("Authorization", "")
    return h[7:] if h.startswith("Bearer ") else None


async def current_user(request: Request) -> User:
    return await user_from_token(bearer(request))


app = FastAPI()


@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"message": "CineStudio API"}


@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    email = normalize(body.email)
    r = await db.password_resets.find_one({"email": email})
    if not r or r.get("used"):
        raise HTTPException(400, "Codice scaduto o non valido")

    exp = r["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now():
        raise HTTPException(400, "Codice scaduto o non valido")

    if not bcrypt.checkpw(body.code.encode(), r["code"].encode()):
        raise HTTPException(400, "Codice non valido")

    pw = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    u = await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1})
    await db.users.update_one({"email": email}, {"$set": {"password_hash": pw}})
    await db.password_resets.delete_one({"email": email})
    if u:
        await db.user_sessions.delete_many({"user_id": u["user_id"]})
    return {"ok": True}

async def send_email(to: str, subject: str, text: str):
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        raise HTTPException(500, "Email non configurata")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "from": os.environ.get("EMAIL_FROM", "CineStudio <onboarding@resend.dev>"),
                "to": [to],
                "subject": subject,
                "text": text,
            },
        )
        if r.status_code >= 400:
            raise HTTPException(502, "Invio email non riuscito")


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    email = normalize(body.email)
    u = await db.users.find_one({"email": email}, {"_id": 0})
    if u:
        code = f"{secrets.randbelow(1000000):06d}"
        await db.password_resets.update_one(
            {"email": email},
            {"$set": {
                "code": bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode(),
                "expires_at": now() + timedelta(minutes=15),
                "used": False,
            }},
            upsert=True,
        )
        await send_email(
            email,
            "Recupero password CineStudio",
            f"Il tuo codice è: {code}\nScade tra 15 minuti.",
        )
    return {"ok": True}


@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    email = normalize(body.email)
    r = await db.password_resets.find_one({"email": email})
    if not r or r.get("used") or r["expires_at"] < now():
        raise HTTPException(400, "Codice scaduto o non valido")
    if not bcrypt.checkpw(body.code.encode(), r["code"].encode()):
        raise HTTPException(400, "Codice non valido")

    pw = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"email": email}, {"$set": {"password_hash": pw}})
    await db.password_resets.delete_one({"email": email})
    await db.user_sessions.delete_many({"user_id": r.get("user_id") or ""})
    return {"ok": True}

@api.post("/auth/login")
async def login(body: LoginIn):
    u = await db.users.find_one({"email": normalize(body.email)}, {"_id": 0})
    if not u or not u.get("password_hash") or not bcrypt.checkpw(body.password.encode(), u["password_hash"].encode()):
        raise HTTPException(401, "Email o password non corretti")
    return {"session_token": await create_session(u["user_id"]), "user": to_user(u).model_dump()}


@api.post("/auth/session")
async def google_session(body: SessionIn):
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(401, "Sessione Google non valida")
    d = r.json()
    email = normalize(d["email"])
    u = await db.users.find_one({"email": email}, {"_id": 0})
    if u:
        user_id = u["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": d.get("name") or u.get("name", ""), "picture": d.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": email, "name": d.get("name", ""), "picture": d.get("picture"), "role": "user", "created_at": now()})
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"session_token": await create_session(user_id), "user": to_user(u).model_dump()}


@api.get("/auth/me")
async def me(request: Request):
    return (await current_user(request)).model_dump()


@api.put("/auth/me")
async def update_me(body: ProfileIn, request: Request):
    user = await current_user(request)
    await db.users.update_one({"user_id": user.user_id}, {"$set": body.model_dump()})
    return to_user(await db.users.find_one({"user_id": user.user_id}, {"_id": 0})).model_dump()


@api.post("/auth/logout")
async def logout(request: Request):
    t = bearer(request)
    if t:
        await db.user_sessions.delete_one({"session_token": t})
    return {"ok": True}


# ---------------------------------------------------------------- projects
MEMBER_ROLES = ("viewer", "editor", "admin")


def role_of(p: dict, user: User) -> str:
    if p["owner_id"] == user.user_id:
        return "owner"
    return next((m.get("role") for m in p.get("members", []) if m.get("email") == user.email), "viewer")


async def own_project(pid: str, user: User, write: bool = False, manage: bool = False, owner_only: bool = False) -> dict:
    """Owner: everything. admin: edit + manage team. editor: edit. viewer: read only."""
    p = await db.projects.find_one({"id": pid, "$or": [{"owner_id": user.user_id}, {"members.email": user.email}]}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Progetto non trovato")
    role = role_of(p, user)
    if owner_only and role != "owner":
        raise HTTPException(403, "Solo il proprietario può farlo")
    if manage and role not in ("owner", "admin"):
        raise HTTPException(403, "Solo proprietario e amministratori gestiscono il team")
    if write and role == "viewer":
        raise HTTPException(403, "Hai accesso in sola visione a questo progetto")
    p["my_role"] = role
    return p


@api.get("/projects")
async def list_projects(request: Request):
    user = await current_user(request)
    docs = await db.projects.find({"$or": [{"owner_id": user.user_id}, {"members.email": user.email}]}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return [Project(**{**d, "my_role": role_of(d, user)}).model_dump() for d in docs]


@api.put("/projects/{pid}/members")
async def set_members(pid: str, body: MembersIn, request: Request):
    user = await current_user(request)
    await own_project(pid, user, manage=True)
    members = [
        {"email": normalize(m.get("email", "")), "role": m.get("role") if m.get("role") in MEMBER_ROLES else "viewer", "job": str(m.get("job", ""))[:80]}
        for m in body.members
        if "@" in str(m.get("email", ""))
    ]
    await db.projects.update_one({"id": pid}, {"$set": {"members": members}})
    return Project(**await own_project(pid, user)).model_dump()


@api.post("/projects")
async def create_project(body: ProjectIn, request: Request):
    user = await current_user(request)
    t = iso(now())
    p = Project(**body.model_dump(), id=str(uuid.uuid4()), owner_id=user.user_id, created_at=t, updated_at=t)
    await db.projects.insert_one(p.model_dump())
    return p.model_dump()


@api.get("/projects/{pid}")
async def get_project(pid: str, request: Request):
    return Project(**await own_project(pid, await current_user(request))).model_dump()


@api.put("/projects/{pid}")
async def update_project(pid: str, body: ProjectIn, request: Request):
    user = await current_user(request)
    await own_project(pid, user, write=True)
    await db.projects.update_one({"id": pid}, {"$set": {**body.model_dump(), "updated_at": iso(now())}})
    return Project(**await own_project(pid, user)).model_dump()


@api.delete("/projects/{pid}")
async def delete_project(pid: str, request: Request):
    user = await current_user(request)
    await own_project(pid, user, owner_only=True)
    await db.projects.delete_one({"id": pid})
    await db.items.delete_many({"project_id": pid})
    return {"ok": True}


@api.get("/projects/{pid}/summary")
async def project_summary(pid: str, request: Request):
    user = await current_user(request)
    await own_project(pid, user)
    rows = await db.items.aggregate([{"$match": {"project_id": pid}}, {"$group": {"_id": "$module", "n": {"$sum": 1}}}]).to_list(100)
    return {r["_id"]: r["n"] for r in rows}


# ---------------------------------------------------------------- items
@api.get("/projects/{pid}/items")
async def list_items(pid: str, request: Request, module: Optional[str] = Query(None)):
    user = await current_user(request)
    await own_project(pid, user)
    q: dict = {"project_id": pid}
    if module:
        q["module"] = module
    docs = await db.items.find(q, {"_id": 0, "owner_id": 0}).sort([("module", 1), ("order", 1)]).to_list(5000)
    return [Item(**d).model_dump() for d in docs]


@api.post("/projects/{pid}/items")
async def create_item(pid: str, body: ItemIn, request: Request):
    user = await current_user(request)
    await own_project(pid, user, write=True)
    order = body.order
    if order is None:
        last = await db.items.find({"project_id": pid, "module": body.module}, {"_id": 0, "order": 1}).sort("order", -1).limit(1).to_list(1)
        order = (last[0]["order"] + 1) if last else 1
    t = iso(now())
    item = Item(id=str(uuid.uuid4()), project_id=pid, module=body.module, title=body.title, data=body.data, order=order, created_at=t, updated_at=t)
    await db.items.insert_one({**item.model_dump(), "owner_id": user.user_id})
    await db.projects.update_one({"id": pid}, {"$set": {"updated_at": t}})
    return item.model_dump()


async def own_item(iid: str, user: User, write: bool = False) -> dict:
    d = await db.items.find_one({"id": iid}, {"_id": 0, "owner_id": 0})
    if not d:
        raise HTTPException(404, "Elemento non trovato")
    await own_project(d["project_id"], user, write=write)
    return d


@api.put("/items/{iid}")
async def update_item(iid: str, body: ItemUpdate, request: Request):
    user = await current_user(request)
    d = await own_item(iid, user, write=True)
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    t = iso(now())
    upd["updated_at"] = t
    await db.items.update_one({"id": iid}, {"$set": upd})
    await db.projects.update_one({"id": d["project_id"]}, {"$set": {"updated_at": t}})
    return Item(**await own_item(iid, user)).model_dump()


@api.delete("/items/{iid}")
async def delete_item(iid: str, request: Request):
    user = await current_user(request)
    await own_item(iid, user, write=True)
    await db.items.delete_one({"id": iid})
    return {"ok": True}


# ---------------------------------------------------------------- library (user-wide, e.g. lens kit)
class LibItemIn(BaseModel):
    title: str
    data: dict[str, Any] = Field(default_factory=dict)


class LibBulkIn(BaseModel):
    kind: str
    items: list[LibItemIn]


@api.get("/library")
async def list_library(request: Request, kind: str = Query(...)):
    user = await current_user(request)
    return await db.library.find({"owner_id": user.user_id, "kind": kind}, {"_id": 0, "owner_id": 0}).sort("created_at", 1).to_list(2000)


@api.post("/library/bulk")
async def add_library(body: LibBulkIn, request: Request):
    user = await current_user(request)
    docs = [{"id": str(uuid.uuid4()), "owner_id": user.user_id, "kind": body.kind, "title": i.title, "data": i.data, "created_at": iso(now())} for i in body.items[:200]]
    if docs:
        await db.library.insert_many(docs)
    return {"added": len(docs)}


@api.put("/library/{lid}")
async def update_library(lid: str, body: LibItemIn, request: Request):
    user = await current_user(request)
    r = await db.library.update_one({"id": lid, "owner_id": user.user_id}, {"$set": {"title": body.title, "data": body.data}})
    if not r.matched_count:
        raise HTTPException(404, "Elemento non trovato")
    return {"ok": True}


@api.delete("/library/{lid}")
async def delete_library(lid: str, request: Request):
    user = await current_user(request)
    r = await db.library.delete_one({"id": lid, "owner_id": user.user_id})
    if not r.deleted_count:
        raise HTTPException(404, "Elemento non trovato")
    return {"ok": True}


# ---------------------------------------------------------------- files
@api.post("/upload")
async def upload(request: Request, file: UploadFile = File(...)):
    user = await current_user(request)
    data = await file.read()
    if len(data) > 200 * 1024 * 1024:
        raise HTTPException(413, "File troppo grande (max 200MB)")
    ext = (file.filename or "file.jpg").rsplit(".", 1)[-1].lower()[:5]
    path = f"{APP_NAME}/uploads/{user.user_id}/{uuid.uuid4().hex}.{ext}"
    ctype = file.content_type or "image/jpeg"
    try:
        res = await run_in_threadpool(put_object, path, data, ctype)
    except requests.HTTPError as e:
        code = e.response.status_code if e.response is not None else 500
        if code == 402:
            raise HTTPException(402, "Spazio di archiviazione esaurito")
        raise HTTPException(502, "Caricamento non riuscito")
    await db.files.insert_one({"path": res["path"], "owner_id": user.user_id, "content_type": ctype, "name": file.filename, "created_at": now()})
    return {"path": res["path"]}


@api.get("/files/{path:path}")
async def download(path: str, request: Request, token: Optional[str] = Query(None)):
    user = await user_from_token(bearer(request) or token)
    # Paths are unguessable; any signed-in collaborator of a shared project can view its files.
    rec = await db.files.find_one({"path": path}, {"_id": 0})
    if not rec or not user:
        raise HTTPException(404, "File non trovato")
    data, ctype = await run_in_threadpool(get_object, path)
    return Response(content=data, media_type=rec.get("content_type") or ctype, headers={"Cache-Control": "private, max-age=86400"})


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


async def seed_admin():
    email = normalize(os.environ["ADMIN_EMAIL"])
    pw = os.environ["ADMIN_PASSWORD"]
    u = await db.users.find_one({"email": email}, {"_id": 0})
    if not u:
        await db.users.insert_one({"user_id": f"user_{uuid.uuid4().hex[:12]}", "email": email, "name": "Admin", "role": "admin", "password_hash": bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode(), "created_at": now()})
    elif not u.get("password_hash") or not bcrypt.checkpw(pw.encode(), u["password_hash"].encode()):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode(), "role": "admin"}})


@app.on_event("startup")
async def startup():
    app.state.index_task = asyncio.create_task(ensure_indexes())
    try:
        await seed_admin()
    except Exception as e:
        logger.error("seed_admin: %s", e)
    try:
        await run_in_threadpool(init_storage)
    except Exception as e:
        logger.error("init_storage: %s", e)


@app.on_event("shutdown")
async def shutdown():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()
