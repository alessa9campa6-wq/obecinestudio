import json
import io
import asyncio
import os
import logging
import secrets
import time
import re
import uuid
import unicodedata
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
from pymongo import ASCENDING, DESCENDING, IndexModel, ReturnDocument
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
        # Il nome utente è pubblico: chi lo conosce ti trova e ti invita. Senza
        # questo indice due account potrebbero scegliere lo stesso @nome.
        IndexModel([("username", ASCENDING)], name="username", unique=True, sparse=True),
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
    "calendar": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("date", ASCENDING)], name="owner_date"),
        IndexModel([("owner_id", ASCENDING), ("piano_id", ASCENDING)], name="owner_piano"),
    ],
    "files": [IndexModel([("path", ASCENDING)], name="path", unique=True)],
    "library": [IndexModel([("owner_id", ASCENDING), ("kind", ASCENDING)], name="owner_kind"), IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "posts": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("author_id", ASCENDING), ("created_at", DESCENDING)], name="author_created"),
        IndexModel([("privacy", ASCENDING), ("kind", ASCENDING), ("created_at", DESCENDING)], name="privacy_kind_created"),
    ],
    "follows": [
        IndexModel([("follower_id", ASCENDING), ("followee_id", ASCENDING)], name="follow_pair", unique=True),
        IndexModel([("followee_id", ASCENDING)], name="followee"),
    ],
    "comments": [
        IndexModel([("post_id", ASCENDING), ("created_at", ASCENDING)], name="post_created"),
    ],
    "messages": [
        IndexModel([("thread", ASCENDING), ("created_at", ASCENDING)], name="thread_created"),
        IndexModel([("chat_id", ASCENDING), ("created_at", ASCENDING)], name="chat_created"),
        IndexModel([("to_id", ASCENDING), ("read", ASCENDING)], name="to_read"),
    ],
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


async def dedupe_project_chats() -> None:
    """Una chat del team per progetto. Se in passato ne sono nate due (perché
    due richieste quasi insieme l'hanno creata), i messaggi si spostano nella
    piu vecchia e le altre vengono tolte."""
    visti: dict[str, str] = {}
    try:
        async for c in db.chats.find({"kind": "project"}, {"_id": 0}).sort("created_at", ASCENDING):
            pid = c.get("project_id")
            if not pid:
                continue
            if pid in visti:
                await db.chat_messages.update_many({"chat_id": c["id"]}, {"$set": {"chat_id": visti[pid]}})
                await db.chats.delete_one({"id": c["id"]})
                logger.info("Chat di progetto doppia rimossa: %s", c.get("name"))
            else:
                visti[pid] = c["id"]
    except Exception as exc:
        logger.error("dedupe_project_chats: %s", exc)


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
class RentalIn(BaseModel):
    """Il noleggio di chi usa l'app: vuoto se non ne ha uno."""
    nome: str = ""
    citta: str = ""
    # Luogo vero del noleggio (città scelta dall'elenco) per la vetrina e la ricerca.
    city: str = ""
    lat: float | None = None
    lng: float | None = None
    telefono: str = ""
    email: str = ""
    sito: str = ""
    instagram: str = ""
    attrezzatura: str = ""
    note: str = ""
    # Foto di copertina della vetrina noleggio (path o URL).
    cover: str = ""


class User(BaseModel):
    user_id: str
    email: str
    name: str = ""
    username: str = ""
    picture: Optional[str] = None
    role: str = "user"
    profiles: list[str] = Field(default_factory=list)
    crew_role: str = ""
    view_mode: str = "filmmaker"
    bio: str = ""
    link: str = ""
    # Cosa si vede sul profilo: posizione, contatti e copertine scelte da te.
    position: str = ""
    instagram: str = ""
    contact_email: str = ""
    cover: str = ""
    covers: dict = Field(default_factory=dict)
    show: dict = Field(default_factory=dict)
    roles: list[str] = Field(default_factory=list)
    position_meta: dict = Field(default_factory=dict)
    # Tariffa abituale per ogni ruolo. Resta privata: non compare nel profilo
    # pubblico, serve solo a precompilare la troupe dei progetti.
    tariffe: dict = Field(default_factory=dict)
    rental: dict = Field(default_factory=dict)


class ProfileIn(BaseModel):
    name: str = ""
    username: str = ""
    picture: Optional[str] = None
    profiles: list[str] = Field(default_factory=list)
    crew_role: str = ""
    view_mode: str = "filmmaker"
    bio: str = ""
    link: str = ""
    position: str = ""
    instagram: str = ""
    contact_email: str = ""
    cover: str = ""
    covers: dict = Field(default_factory=dict)
    show: dict = Field(default_factory=dict)
    roles: list[str] = Field(default_factory=list)
    position_meta: dict = Field(default_factory=dict)
    tariffe: dict = Field(default_factory=dict)
    rental: RentalIn = Field(default_factory=RentalIn)


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str = ""
    username: str = ""


class LoginIn(BaseModel):
    email: str
    password: str


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


class EventoIn(BaseModel):
    date: str
    type: str = "Ripresa"
    title: str
    note: str = ""
    time: Optional[str] = None
    project_id: Optional[str] = None
    location_id: Optional[str] = None


class EventoUpdate(BaseModel):
    date: Optional[str] = None
    type: Optional[str] = None
    title: Optional[str] = None
    note: Optional[str] = None
    time: Optional[str] = None
    project_id: Optional[str] = None
    location_id: Optional[str] = None


class Evento(BaseModel):
    id: str
    date: str
    type: str
    title: str
    note: str = ""
    time: Optional[str] = None
    project_id: Optional[str] = None
    location_id: Optional[str] = None
    piano_id: Optional[str] = None
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
        user_id=doc["user_id"], email=doc["email"], name=doc.get("name", ""), username=doc.get("username", ""), picture=doc.get("picture"), role=doc.get("role", "user"),
        profiles=doc.get("profiles", []), crew_role=doc.get("crew_role", ""), view_mode=doc.get("view_mode", "filmmaker"),
        bio=doc.get("bio", ""), link=doc.get("link", ""),
        position=doc.get("position", ""), instagram=doc.get("instagram", ""), contact_email=doc.get("contact_email", ""),
        cover=doc.get("cover", ""), covers=doc.get("covers", {}), show=doc.get("show", {}),
        roles=doc.get("roles") or [], position_meta=doc.get("position_meta") or {},
        tariffe=doc.get("tariffe") or {},
        rental=doc.get("rental", {}),
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


@api.post("/auth/register")
async def register(body: RegisterIn):
    email = normalize(body.email)
    if "@" not in email:
        raise HTTPException(422, "Email non valida")
    if await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1}):
        raise HTTPException(409, "Email già registrata: accedi con password o con Google")
    pw = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    wanted = normalize_username(body.username)
    if wanted:
        if not valid_username(wanted):
            raise HTTPException(422, "Nome utente non valido: da 3 a 20 caratteri tra lettere, numeri, punto e trattino basso")
        if await username_taken(wanted):
            raise HTTPException(409, "Nome utente già in uso: scegline un altro")
        username = wanted
    else:
        username = await unique_username(email.split("@")[0])
    await db.users.insert_one({"user_id": user_id, "email": email, "username": username, "name": body.name or email.split("@")[0], "password_hash": pw, "role": "user", "created_at": now()})
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"session_token": await create_session(user_id), "user": to_user(u).model_dump()}


@api.post("/auth/login")
async def login(body: LoginIn):
    u = await db.users.find_one({"email": normalize(body.email)}, {"_id": 0})
    if not u or not u.get("password_hash") or not bcrypt.checkpw(body.password.encode(), u["password_hash"].encode()):
        raise HTTPException(401, "Email o password non corretti")
    return {"session_token": await create_session(u["user_id"]), "user": to_user(u).model_dump()}


@api.get("/auth/me")
async def me(request: Request):
    return (await current_user(request)).model_dump()


@api.put("/auth/me")
async def update_me(body: ProfileIn, request: Request):
    user = await current_user(request)
    data = body.model_dump()
    wanted = normalize_username(data.pop("username", ""))
    if wanted and wanted != user.username:
        if not valid_username(wanted):
            raise HTTPException(422, "Nome utente non valido: da 3 a 20 caratteri tra lettere, numeri, punto e trattino basso")
        if await username_taken(wanted, user.user_id):
            raise HTTPException(409, "Nome utente già in uso: scegline un altro")
        data["username"] = wanted
    await db.users.update_one({"user_id": user.user_id}, {"$set": data})
    return to_user(await db.users.find_one({"user_id": user.user_id}, {"_id": 0})).model_dump()


@api.delete("/auth/me")
async def delete_me(request: Request):
    """Cancella l'account e tutto quello che gli appartiene."""
    user = await current_user(request)
    uid = user.user_id
    post_ids = [p["id"] for p in await db.posts.find({"author_id": uid}, {"_id": 0, "id": 1}).to_list(5000)]
    await db.comments.delete_many({"post_id": {"$in": post_ids}})
    await db.comments.delete_many({"author_id": uid})
    await db.posts.delete_many({"author_id": uid})
    await db.posts.update_many({"likes": uid}, {"$pull": {"likes": uid}})
    await db.follows.delete_many({"$or": [{"follower_id": uid}, {"followee_id": uid}]})
    await db.projects.delete_many({"owner_id": uid})
    await db.projects.update_many({"members.user_id": uid}, {"$pull": {"members": {"user_id": uid}}})
    await db.files.delete_many({"owner_id": uid})
    await db.user_sessions.delete_many({"user_id": uid})
    await db.password_resets.delete_many({"email": user.email})
    await db.users.delete_one({"user_id": uid})
    return {"ok": True}


@api.post("/auth/logout")
async def logout(request: Request):
    t = bearer(request)
    if t:
        await db.user_sessions.delete_one({"session_token": t})
    return {"ok": True}


# ---------------------------------------------------------------- projects
MEMBER_ROLES = ("viewer", "editor", "admin")


USERNAME_CHARS = set("abcdefghijklmnopqrstuvwxyz0123456789._")


def normalize_username(raw: Optional[str]) -> str:
    """"@Alessandro" e "alessandro" sono lo stesso nome utente."""
    s = str(raw or "").strip().lower()
    return s[1:] if s.startswith("@") else s


def valid_username(u: str) -> bool:
    return (
        3 <= len(u) <= 20
        and all(c in USERNAME_CHARS for c in u)
        and any(c.isalpha() for c in u)
        and not (u[0] in "._" or u[-1] in "._")
    )


async def username_taken(u: str, user_id: str = "") -> bool:
    doc = await db.users.find_one({"username": u, "user_id": {"$ne": user_id}}, {"_id": 0, "user_id": 1})
    return doc is not None


async def unique_username(base: str) -> str:
    """Se il nome è già preso aggiunge un numero: alessandro, alessandro2..."""
    clean = "".join(c for c in normalize_username(base) if c in USERNAME_CHARS)[:16] or "cineasta"
    if not any(c.isalpha() for c in clean):
        clean = f"cine{clean}"
    candidate = clean
    n = 1
    while await username_taken(candidate):
        n += 1
        candidate = f"{clean}{n}"[:20]
    return candidate


def access_filter(user: User) -> list[dict]:
    """Un progetto è tuo, oppure sei nel team per account (@nome) o per email.
    L'email resta per gli inviti fatti prima che esistessero i nomi utente."""
    return [
        {"owner_id": user.user_id},
        {"members.user_id": user.user_id},
        {"members.email": user.email},
    ]


class PersonOut(BaseModel):
    user_id: str
    username: str = ""
    name: str = ""
    picture: Optional[str] = None


@api.get("/people/search")
async def search_people(request: Request, q: str = Query("", max_length=60)):
    """Cerca le persone da invitare: per @nome utente o per nome e cognome."""
    user = await current_user(request)
    term = normalize_username(q)
    if len(term) < 2:
        return []
    like = {"$regex": re.escape(term), "$options": "i"}
    docs = await db.users.find(
        {"user_id": {"$ne": user.user_id}, "$or": [{"username": like}, {"name": like}]},
        {"_id": 0, "user_id": 1, "username": 1, "name": 1, "picture": 1},
    ).to_list(20)
    # Gli account creati prima dei nomi utente non hanno il campo: senza il
    # "or" la risposta andrebbe in errore proprio su quelle persone.
    found = [
        PersonOut(
            user_id=d["user_id"],
            username=d.get("username") or "",
            name=d.get("name") or "",
            picture=d.get("picture"),
        ).model_dump()
        for d in docs
    ]
    # Prima chi ha il nome utente che combacia dall'inizio: è la ricerca più precisa.
    found.sort(key=lambda person: (not (person["username"] or "").startswith(term), (person["username"] or person["name"] or "").lower()))
    return found


@api.get("/people/{username}/rates")
async def person_rates(username: str, request: Request):
    """Ruoli e tariffe abituali di una persona, per precompilare la troupe.

    Le tariffe non compaiono mai nel profilo pubblico: si leggono solo qui, da
    un account che sta lavorando a un progetto.
    """
    await current_user(request)
    u = normalize_username(username)
    d = await db.users.find_one(
        {"username": u},
        {"_id": 0, "user_id": 1, "username": 1, "name": 1, "picture": 1, "roles": 1, "crew_role": 1, "tariffe": 1},
    )
    if not d:
        raise HTTPException(404, "Persona non trovata")
    roles = d.get("roles") or ([d.get("crew_role")] if d.get("crew_role") else [])
    return {
        "user_id": d["user_id"],
        "username": d.get("username") or "",
        "name": d.get("name") or "",
        "picture": d.get("picture"),
        "roles": roles,
        "tariffe": d.get("tariffe") or {},
    }


@api.get("/people/username/{name}")
async def username_state(name: str, request: Request):
    """Mentre scrivi il nome utente ti dice se è valido e se è libero."""
    user = await current_user(request)
    u = normalize_username(name)
    if not valid_username(u):
        return {"username": u, "valid": False, "free": False, "reason": "Da 3 a 20 caratteri: lettere, numeri, punto o trattino basso"}
    if u == user.username:
        return {"username": u, "valid": True, "free": True, "reason": "È il tuo nome utente"}
    free = not await username_taken(u, user.user_id)
    return {"username": u, "valid": True, "free": free, "reason": "" if free else "Già in uso, provane un altro"}


def member_matches(m: dict, user: User) -> bool:
    if m.get("user_id"):
        return m["user_id"] == user.user_id
    return bool(m.get("email")) and m["email"] == user.email


def role_of(p: dict, user: User) -> str:
    if p["owner_id"] == user.user_id:
        return "owner"
    return next((m.get("role") or "viewer" for m in p.get("members", []) if member_matches(m, user)), "viewer")


async def own_project(pid: str, user: User, write: bool = False, manage: bool = False, owner_only: bool = False) -> dict:
    """Owner: everything. admin: edit + manage team. editor: edit. viewer: read only."""
    p = await db.projects.find_one({"id": pid, "$or": access_filter(user)}, {"_id": 0})
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
    docs = await db.projects.find({"$or": access_filter(user)}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return [Project(**{**d, "my_role": role_of(d, user)}).model_dump() for d in docs]


@api.put("/projects/{pid}/members")
async def set_members(pid: str, body: MembersIn, request: Request):
    """Il team si aggiorna per @nome utente o, per chi non ha ancora l'app, per email.
    Il membro porta user_id, nome e foto: l'app non deve indovinare niente."""
    user = await current_user(request)
    project = await own_project(pid, user, manage=True)
    members: list[dict] = []
    seen: set[str] = set()
    for m in body.members:
        role = m.get("role") if m.get("role") in MEMBER_ROLES else "viewer"
        job = str(m.get("job", ""))[:80]
        email = normalize(str(m.get("email") or ""))
        uname = normalize_username(str(m.get("username") or ""))
        uid = str(m.get("user_id") or "").strip()
        target = await db.users.find_one({"user_id": uid}, {"_id": 0}) if uid else None
        if not target and uname:
            target = await db.users.find_one({"username": uname}, {"_id": 0})
        if not target and "@" in email:
            target = await db.users.find_one({"email": email}, {"_id": 0})
        if target:
            # Il proprietario non è un membro: non si invita se stesso.
            if target["user_id"] == project["owner_id"] or target["user_id"] in seen:
                continue
            # La stessa persona potrebbe essere già nel team con il solo indirizzo
            # email (invito vecchio): in quel caso non la si aggiunge due volte.
            if any(x.get("email") == target["email"] for x in members):
                continue
            seen.add(target["user_id"])
            members.append({
                "user_id": target["user_id"],
                "username": target.get("username", ""),
                "name": target.get("name", ""),
                "picture": target.get("picture"),
                "email": target["email"],
                "role": role,
                "job": job,
            })
        elif "@" in email:
            if email in seen:
                continue
            seen.add(email)
            members.append({"email": email, "role": role, "job": job})
        else:
            raise HTTPException(404, "Nessuna persona trovata: cerca il suo @nome utente o scrivi l'email")
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
    if item.module == "piano":
        await _sync_piano_evento(item.id, user.user_id, item.project_id, item.model_dump())
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
    aggiornato = Item(**await own_item(iid, user)).model_dump()
    if aggiornato["module"] == "piano":
        await _sync_piano_evento(iid, user.user_id, aggiornato.get("project_id"), aggiornato)
    return aggiornato


@api.delete("/items/{iid}")
async def delete_item(iid: str, request: Request):
    user = await current_user(request)
    d = await own_item(iid, user, write=True)
    await db.items.delete_one({"id": iid})
    if d.get("module") == "piano":
        await _sync_piano_evento(iid, user.user_id, d.get("project_id"), None)
    return {"ok": True}


# ---------------------------------------------------------------- calendario
# Ogni evento ha un owner_id (chi l'ha creato), così resta visibile su tutti i
# suoi dispositivi. Gli eventi legati a un progetto condiviso sono però visibili
# a tutto il team: altrimenti una giornata di ripresa pianificata dal proprietario
# non comparirebbe a chi lavora con lui.
async def project_roles(user: User) -> dict[str, str]:
    docs = await db.projects.find(
        {"$or": access_filter(user)},
        {"_id": 0, "id": 1, "owner_id": 1, "members": 1},
    ).to_list(500)
    return {d["id"]: role_of(d, user) for d in docs}


@api.get("/calendar")
async def list_events(request: Request):
    user = await current_user(request)
    roles = await project_roles(user)
    docs = (
        await db.calendar.find(
            {"$or": [{"owner_id": user.user_id}, {"project_id": {"$in": list(roles.keys())}}]},
            {"_id": 0},
        )
        .sort([("date", 1), ("time", 1)])
        .to_list(5000)
    )
    visti: set[str] = set()
    fuori: list[dict] = []
    for d in docs:
        # Un evento mio su un mio progetto esce da entrambe le condizioni.
        if d["id"] in visti:
            continue
        visti.add(d["id"])
        mio = d.pop("owner_id", None) == user.user_id
        ruolo = roles.get(d.get("project_id") or "", "")
        fuori.append(
            {**Evento(**d).model_dump(), "can_edit": mio or ruolo in ("owner", "admin", "editor")}
        )
    return fuori


async def own_event(eid: str, user: User, write: bool = False) -> dict:
    """Evento mio, oppure di un progetto condiviso a cui ho accesso."""
    d = await db.calendar.find_one({"id": eid}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Evento non trovato")
    if d.get("owner_id") == user.user_id:
        return d
    ruolo = (await project_roles(user)).get(d.get("project_id") or "")
    if not ruolo:
        # Non rivelo che l'evento esiste a chi non può vederlo.
        raise HTTPException(404, "Evento non trovato")
    if write and ruolo == "viewer":
        raise HTTPException(403, "Hai accesso in sola visione a questo progetto")
    return d


async def check_event_project(project_id: Optional[str], user: User, write: bool = False) -> None:
    # Un evento può non essere legato a nessun progetto; se lo è, deve essere
    # un progetto a cui l'utente ha accesso (e per scriverci, non in sola visione).
    if project_id:
        await own_project(project_id, user, write=write)


@api.post("/calendar")
async def create_event(body: EventoIn, request: Request):
    user = await current_user(request)
    titolo = body.title.strip()
    if not titolo:
        raise HTTPException(400, "Titolo obbligatorio")
    if len(body.date) != 10 or body.date[4] != "-":
        raise HTTPException(400, "Data non valida")
    await check_event_project(body.project_id, user, write=True)
    t = iso(now())
    evento = Evento(
        id=str(uuid.uuid4()),
        date=body.date,
        type=body.type or "Ripresa",
        title=titolo,
        note=body.note.strip(),
        time=body.time or None,
        project_id=body.project_id,
        location_id=body.location_id,
        created_at=t,
        updated_at=t,
    )
    await db.calendar.insert_one({**evento.model_dump(), "owner_id": user.user_id})
    return evento.model_dump()


@api.put("/calendar/{eid}")
async def update_event(eid: str, body: EventoUpdate, request: Request):
    user = await current_user(request)
    await own_event(eid, user, write=True)
    # exclude_unset: permette di svuotare orario, progetto o location (null esplicito).
    upd = body.model_dump(exclude_unset=True)
    if "project_id" in upd:
        await check_event_project(upd["project_id"], user, write=True)
    if upd.get("title") is not None:
        upd["title"] = upd["title"].strip()
        if not upd["title"]:
            raise HTTPException(400, "Titolo obbligatorio")
    if upd.get("note") is not None:
        upd["note"] = upd["note"].strip()
    upd["updated_at"] = iso(now())
    # Il filtro resta sull'id: un collaboratore che modifica un evento del team
    # non deve fallire solo perché l'owner_id è di un altro.
    await db.calendar.update_one({"id": eid}, {"$set": upd})
    aggiornato = await own_event(eid, user)
    aggiornato.pop("owner_id", None)
    return Evento(**aggiornato).model_dump()


@api.delete("/calendar/{eid}")
async def delete_event(eid: str, request: Request):
    user = await current_user(request)
    await own_event(eid, user, write=True)
    await db.calendar.delete_one({"id": eid})
    return {"ok": True}


# Una giornata del piano di lavorazione vive anche in calendario, nello stesso
# utente del progetto, così la vede su tutti i suoi dispositivi. Il legame è
# piano_id: l'evento segue la giornata, quindi si crea, si aggiorna e sparisce
# insieme a lei. Così non restano eventi orfani quando la data cambia.
def _piano_evento(piano: dict) -> Optional[dict[str, Any]]:
    data = piano.get("data") or {}
    giorno = str(data.get("data") or "").strip()[:10]
    if len(giorno) != 10 or giorno[4] != "-" or giorno[7] != "-":
        return None

    numero = str(data.get("numero") or "").strip()
    titolo = (piano.get("title") or "").strip() or (f"Giornata {numero}" if numero else "Ripresa")
    orario = str(data.get("convocazione") or "").strip() or None
    location = data.get("location")

    return {
        "piano_id": piano["id"],
        "date": giorno,
        "type": "Ripresa",
        "title": titolo,
        "time": orario,
        "project_id": piano.get("project_id"),
        "location_id": str(location) if location else None,
    }


async def _owner_di_progetto(pid: Optional[str], fallback: str) -> str:
    if not pid:
        return fallback
    doc = await db.projects.find_one({"id": pid}, {"_id": 0, "owner_id": 1})
    return (doc or {}).get("owner_id") or fallback


async def _sync_piano_evento(
    piano_id: str, user_id: str, project_id: Optional[str], piano: Optional[dict]
) -> None:
    """Allinea il calendario a una giornata: piano=None significa giornata cancellata.

    L'evento appartiene sempre al proprietario del progetto, non a chi ha fatto
    la modifica: altrimenti un collaboratore che tocca la giornata creerebbe un
    secondo evento, e il team vedrebbe due volte la stessa ripresa.
    """
    if piano is None:
        await db.calendar.delete_many({"piano_id": piano_id})
        return

    atteso = _piano_evento(piano)
    if atteso is None:
        # La giornata non ha più una data valida: l'evento non deve restare.
        await db.calendar.delete_many({"piano_id": piano_id})
        return

    owner_id = await _owner_di_progetto(project_id or piano.get("project_id"), user_id)
    evento = await db.calendar.find_one({"piano_id": piano_id, "owner_id": owner_id}, {"_id": 0})
    t = iso(now())
    if evento:
        await db.calendar.update_one({"id": evento["id"]}, {"$set": {**atteso, "updated_at": t}})
        return

    nuovo = Evento(id=str(uuid.uuid4()), **atteso, created_at=t, updated_at=t)
    await db.calendar.insert_one({**nuovo.model_dump(), "owner_id": owner_id})


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


# ---------------------------------------------------------------- social
# Post (pubblici, non in elenco, privati), follow, like, commenti e messaggi.
# Il noleggio è un post speciale: kind "rental", visibile solo a chi ha il
# noleggio attivo nel profilo.
POST_KINDS = {"post", "rental"}
POST_PRIVACY = {"public", "unlisted", "private"}


class PostIn(BaseModel):
    text: str = ""
    media: list[str] = Field(default_factory=list)
    kind: str = "post"
    privacy: str = "public"
    project_id: Optional[str] = None
    price: str = ""
    place: str = ""
    # La posizione scelta dalla ricerca luoghi: serve a "vicino a me".
    lat: Optional[float] = None
    lng: Optional[float] = None
    city: str = ""
    # Larghezza/altezza di ogni foto o video, nell'ordine di "media": così il
    # post si vede nel formato originale invece che sempre quadrato.
    ratios: list[float] = Field(default_factory=list)
    # Un lavoro nel portfolio ha un titolo, un tipo e chi ha collaborato.
    title: str = ""
    work_type: str = ""
    tags: list[str] = Field(default_factory=list)
    collab: bool = False


class CommentIn(BaseModel):
    text: str


class MessageIn(BaseModel):
    text: str = ""
    # Post che si sta passando a qualcuno: il messaggio può essere solo il post.
    post_id: str = ""
    # Risposta a un messaggio precedente della stessa conversazione.
    reply_to: str = ""
    # Allegati (foto, file) e messaggio vocale.
    media: list[str] = Field(default_factory=list)
    voice: str = ""
    voice_durata: float = 0


class ReactionIn(BaseModel):
    emoji: str = ""


class ChatIn(BaseModel):
    name: str = ""
    members: list[str] = Field(default_factory=list)
    # Chi può scrivere: vuoto vuol dire tutti i membri.
    can_send: list[str] = Field(default_factory=list)


class ChatMessageIn(BaseModel):
    text: str = ""
    reply_to: str = ""
    media: list[str] = Field(default_factory=list)
    voice: str = ""
    voice_durata: float = 0
    # Nella chat del team ogni messaggio dice a quali reparti serve e che tipo
    # di informazione è (orari, sicurezza, creativo...).
    reparti: list[str] = Field(default_factory=list)
    categoria: str = ""


def thread_key(a: str, b: str) -> str:
    return ":".join(sorted([a, b]))


def public_person(d: dict) -> dict:
    return {
        "user_id": d.get("user_id", ""),
        "username": d.get("username") or "",
        "name": d.get("name") or "",
        "picture": d.get("picture"),
        "crew_role": d.get("crew_role") or "",
        "profiles": d.get("profiles") or [],
        "view_mode": d.get("view_mode") or "filmmaker",
        "bio": d.get("bio") or "",
        "link": d.get("link") or "",
        "position": d.get("position") or "",
        "instagram": d.get("instagram") or "",
        "contact_email": d.get("contact_email") or "",
        "cover": d.get("cover") or "",
        "covers": d.get("covers") or {},
        "show": d.get("show") or {},
        "roles": d.get("roles") or ([d.get("crew_role")] if d.get("crew_role") else []),
        "position_meta": d.get("position_meta") or {},
    }


async def people_by_id(ids) -> dict:
    """Nome, @nome e foto di più persone con una sola lettura."""
    unici = [i for i in dict.fromkeys(ids) if i]
    if not unici:
        return {}
    docs = await db.users.find(
        {"user_id": {"$in": unici}},
        {"_id": 0, "user_id": 1, "username": 1, "name": 1, "picture": 1, "crew_role": 1, "profiles": 1, "view_mode": 1, "bio": 1, "link": 1},
    ).to_list(300)
    return {d["user_id"]: public_person(d) for d in docs}


async def posts_out(docs: list[dict], me: User) -> list[dict]:
    autori = await people_by_id([d.get("author_id") for d in docs])
    vuoto = {"user_id": "", "username": "", "name": "Utente", "picture": None, "crew_role": ""}
    out: list[dict] = []
    for d in docs:
        likes = d.get("likes") or []
        out.append(
            {
                "id": d["id"],
                "author": autori.get(d.get("author_id"), vuoto),
                "text": d.get("text", ""),
                "media": d.get("media") or [],
                "kind": d.get("kind", "post"),
                "privacy": d.get("privacy", "public"),
                "project_id": d.get("project_id"),
                "price": d.get("price", ""),
                "place": d.get("place", ""),
                "city": d.get("city", ""),
                "lat": d.get("lat"),
                "lng": d.get("lng"),
                "ratios": d.get("ratios") or [],
                "title": d.get("title", ""),
                "work_type": d.get("work_type", ""),
                "tags": d.get("tags") or [],
                "collab": bool(d.get("collab")),
                "created_at": iso(d["created_at"]) if d.get("created_at") else "",
                "likes": len(likes),
                "liked": me.user_id in likes,
                "comments": int(d.get("comment_count") or 0),
                "is_mine": d.get("author_id") == me.user_id,
            }
        )
    return out


async def visible_post(pid: str, me: User) -> dict:
    p = await db.posts.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Post non trovato")
    # Un post privato non esiste per nessuno tranne chi l'ha scritto.
    if p.get("privacy") == "private" and p.get("author_id") != me.user_id:
        raise HTTPException(404, "Post non trovato")
    return p


@api.post("/posts")
async def create_post(body: PostIn, request: Request):
    user = await current_user(request)
    testo = (body.text or "").strip()
    kind = body.kind if body.kind in POST_KINDS else "post"
    privacy = body.privacy if body.privacy in POST_PRIVACY else "public"
    media = [m for m in (body.media or []) if isinstance(m, str) and m][:10]
    if not testo and not media:
        raise HTTPException(400, "Scrivi qualcosa o aggiungi una foto")
    if kind == "rental" and not (user.rental or {}).get("nome"):
        raise HTTPException(400, "Prima attiva il tuo noleggio nel profilo")
    if body.project_id:
        await own_project(body.project_id, user)
    doc = {
        "id": f"post_{uuid.uuid4().hex[:12]}",
        "author_id": user.user_id,
        "text": testo[:4000],
        "media": media,
        "kind": kind,
        "privacy": privacy,
        "project_id": body.project_id or None,
        "price": (body.price or "").strip()[:80] if kind == "rental" else "",
        "place": (body.place or "").strip()[:120],
        "city": (body.city or "").strip()[:80],
        "lat": body.lat,
        "lng": body.lng,
        "ratios": [round(float(x), 4) for x in (body.ratios or []) if isinstance(x, (int, float)) and x > 0][:10],
        "title": (body.title or "").strip()[:140],
        "work_type": (body.work_type or "").strip()[:60],
        "tags": [t for t in (body.tags or []) if isinstance(t, str) and t][:20],
        "collab": bool(body.collab),
        "likes": [],
        "comment_count": 0,
        "created_at": now(),
        "updated_at": now(),
    }
    await db.posts.insert_one(dict(doc))
    return (await posts_out([doc], user))[0]


@api.get("/posts/{pid}")
async def get_post(pid: str, request: Request):
    user = await current_user(request)
    p = await visible_post(pid, user)
    return (await posts_out([p], user))[0]


@api.put("/posts/{pid}")
async def update_post(pid: str, body: PostIn, request: Request):
    user = await current_user(request)
    p = await visible_post(pid, user)
    if p.get("author_id") != user.user_id:
        raise HTTPException(403, "Puoi modificare solo i tuoi post")
    testo = (body.text or "").strip()
    media = [m for m in (body.media or []) if isinstance(m, str) and m][:10]
    if not testo and not media:
        raise HTTPException(400, "Scrivi qualcosa o aggiungi una foto")
    privacy = body.privacy if body.privacy in POST_PRIVACY else p.get("privacy", "public")
    kind = body.kind if body.kind in POST_KINDS else p.get("kind", "post")
    prezzo = (body.price or "").strip()[:80] if kind == "rental" else ""
    luogo = (body.place or "").strip()[:120]
    citta = (body.city or "").strip()[:80]
    aggiornato = {
        "text": testo[:4000],
        "media": media,
        "privacy": privacy,
        "kind": kind,
        "price": prezzo,
        "place": luogo,
        "city": citta,
        "lat": body.lat,
        "lng": body.lng,
        "ratios": [round(float(x), 4) for x in (body.ratios or []) if isinstance(x, (int, float)) and x > 0][:10],
        "title": (body.title or "").strip()[:140],
        "work_type": (body.work_type or "").strip()[:60],
        "tags": [t for t in (body.tags or []) if isinstance(t, str) and t][:20],
        "collab": bool(body.collab),
        "updated_at": now(),
    }
    await db.posts.update_one({"id": pid}, {"$set": aggiornato})
    return (await posts_out([{**p, **aggiornato}], user))[0]


@api.delete("/posts/{pid}")
async def delete_post(pid: str, request: Request):
    user = await current_user(request)
    p = await visible_post(pid, user)
    if p.get("author_id") != user.user_id:
        raise HTTPException(403, "Puoi eliminare solo i tuoi post")
    await db.posts.delete_one({"id": pid})
    await db.comments.delete_one({"post_id": pid})
    return {"ok": True}


@api.post("/posts/{pid}/like")
async def like_post(pid: str, request: Request):
    user = await current_user(request)
    await visible_post(pid, user)
    await db.posts.update_one({"id": pid}, {"$addToSet": {"likes": user.user_id}})
    p = await db.posts.find_one({"id": pid}, {"_id": 0})
    return {"liked": True, "likes": len((p or {}).get("likes") or [])}


@api.delete("/posts/{pid}/like")
async def unlike_post(pid: str, request: Request):
    user = await current_user(request)
    await visible_post(pid, user)
    await db.posts.update_one({"id": pid}, {"$pull": {"likes": user.user_id}})
    p = await db.posts.find_one({"id": pid}, {"_id": 0})
    return {"liked": False, "likes": len((p or {}).get("likes") or [])}


@api.get("/posts/{pid}/comments")
async def list_comments(pid: str, request: Request):
    user = await current_user(request)
    await visible_post(pid, user)
    docs = await db.comments.find({"post_id": pid}, {"_id": 0}).sort([("created_at", 1)]).to_list(100)
    autori = await people_by_id([d.get("author_id") for d in docs])
    return [
        {
            "id": d["id"],
            "text": d.get("text", ""),
            "author": autori.get(d.get("author_id"), {"user_id": "", "username": "", "name": "Utente", "picture": None}),
            "created_at": iso(d["created_at"]) if d.get("created_at") else "",
            "is_mine": d.get("author_id") == user.user_id,
        }
        for d in docs
    ]


@api.post("/posts/{pid}/comments")
async def add_comment(pid: str, body: CommentIn, request: Request):
    user = await current_user(request)
    await visible_post(pid, user)
    testo = (body.text or "").strip()[:1000]
    if not testo:
        raise HTTPException(400, "Scrivi un commento")
    doc = {
        "id": f"cmt_{uuid.uuid4().hex[:12]}",
        "post_id": pid,
        "author_id": user.user_id,
        "text": testo,
        "created_at": now(),
    }
    await db.comments.insert_one(dict(doc))
    await db.posts.update_one({"id": pid}, {"$inc": {"comment_count": 1}})
    return {"id": doc["id"], "text": testo, "created_at": iso(doc["created_at"])}


# ---- follow
@api.post("/users/{uid}/follow")
async def follow_user(uid: str, request: Request):
    user = await current_user(request)
    if uid == user.user_id:
        raise HTTPException(400, "Non puoi seguire te stesso")
    if not await db.users.find_one({"user_id": uid}, {"_id": 0, "user_id": 1}):
        raise HTTPException(404, "Persona non trovata")
    await db.follows.update_one(
        {"follower_id": user.user_id, "followee_id": uid},
        {"$setOnInsert": {"created_at": now()}},
        upsert=True,
    )
    return {"following": True}


@api.delete("/users/{uid}/follow")
async def unfollow_user(uid: str, request: Request):
    user = await current_user(request)
    await db.follows.delete_one({"follower_id": user.user_id, "followee_id": uid})
    return {"following": False}


@api.get("/notifications")
async def notifications(request: Request):
    """Le ultime cose successe intorno a te: like, commenti, nuovi follower."""
    me = await current_user(request)
    miei = await db.posts.find(
        {"author_id": me.user_id}, {"_id": 0, "id": 1, "text": 1, "title": 1, "likes": 1}
    ).to_list(200)
    oggetto = {
        p["id"]: (p.get("title") or (p.get("text") or "").split("\n")[0] or "il tuo lavoro")
        for p in miei
    }
    eventi: list[dict] = []

    commenti = await db.comments.find(
        {"post_id": {"$in": list(oggetto.keys())}}, {"_id": 0}
    ).sort("created_at", -1).to_list(30)
    autori_c = await people_by_id([c.get("author_id") for c in commenti])
    for c in commenti:
        if c.get("author_id") == me.user_id:
            continue
        a = autori_c.get(c.get("author_id"))
        if not a:
            continue
        eventi.append({
            "id": c.get("id", ""),
            "tipo": "commento",
            "da": a,
            "post_id": c.get("post_id", ""),
            "oggetto": oggetto.get(c.get("post_id"), "il tuo lavoro"),
            "testo": c.get("text", ""),
            "quando": iso(c["created_at"]) if c.get("created_at") else "",
        })

    likes = [p for p in miei if p.get("likes")]
    autori_l = await people_by_id([uid for p in likes for uid in p.get("likes") or []])
    for p in likes:
        for uid in (p.get("likes") or [])[-5:]:
            a = autori_l.get(uid)
            if not a or uid == me.user_id:
                continue
            eventi.append({
                "id": f"{p['id']}:{uid}",
                "tipo": "mi piace",
                "da": a,
                "post_id": p["id"],
                "oggetto": oggetto.get(p["id"], "il tuo lavoro"),
                "testo": "",
                "quando": "",
            })

    follows = await db.follows.find(
        {"followee_id": me.user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    autori_f = await people_by_id([f.get("follower_id") for f in follows])
    for f in follows:
        a = autori_f.get(f.get("follower_id"))
        if not a:
            continue
        eventi.append({
            "id": f"f:{f.get('follower_id')}",
            "tipo": "follower",
            "da": a,
            "post_id": "",
            "oggetto": "ha iniziato a seguirti",
            "testo": "",
            "quando": iso(f["created_at"]) if f.get("created_at") else "",
        })

    eventi.sort(key=lambda e: e.get("quando") or "", reverse=True)
    return eventi[:40]


async def following_ids(user: User) -> list[str]:
    docs = await db.follows.find({"follower_id": user.user_id}, {"_id": 0, "followee_id": 1}).to_list(1000)
    return [d["followee_id"] for d in docs]


async def _people_list(ids: list[str], me: User, limit: int) -> list[dict]:
    """Righe pronte per l'elenco follower/seguiti, con il "lo seguo" già calcolato."""
    if not ids:
        return []
    persone = await people_by_id(ids)
    miei = set(await following_ids(me))
    fuori = []
    for uid in ids[:limit]:
        d = persone.get(uid)
        if d:
            fuori.append({**public_person(d), "following": uid in miei})
    return fuori


@api.get("/users/{uid}/followers")
async def followers_of(uid: str, request: Request, limit: int = Query(100, ge=1, le=200)):
    """Chi segue questa persona."""
    me = await current_user(request)
    docs = await db.follows.find({"followee_id": uid}, {"_id": 0, "follower_id": 1, "created_at": 1}).sort("created_at", -1).to_list(limit)
    return await _people_list([d["follower_id"] for d in docs], me, limit)


@api.get("/users/{uid}/following")
async def following_of(uid: str, request: Request, limit: int = Query(100, ge=1, le=200)):
    """Chi segue questa persona."""
    me = await current_user(request)
    docs = await db.follows.find({"follower_id": uid}, {"_id": 0, "followee_id": 1, "created_at": 1}).sort("created_at", -1).to_list(limit)
    return await _people_list([d["followee_id"] for d in docs], me, limit)


# ---- feed & esplora
@api.get("/feed")
async def feed(request: Request, limit: int = Query(30, ge=1, le=60)):
    """Quello che pubblicano le persone che segui, più i tuoi post pubblici."""
    user = await current_user(request)
    autori = list(dict.fromkeys([user.user_id, *(await following_ids(user))]))
    docs = await db.posts.find(
        {
            "author_id": {"$in": autori},
            "$or": [{"privacy": "public"}, {"author_id": user.user_id, "privacy": "unlisted"}],
        },
        {"_id": 0},
    ).sort([("created_at", -1)]).to_list(limit)
    return await posts_out(docs, user)


# ---- luoghi
# La posizione non si scrive a mano: si cerca un posto vero e si salva con le
# sue coordinate, così i noleggi possono stare "vicino a me".
def distanza_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    import math

    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 1)


@api.get("/places")
async def search_places(
    request: Request,
    q: str = Query("", max_length=120),
    limit: int = Query(6, ge=1, le=10),
):
    """Cerca città, vie e luoghi veri (OpenStreetMap): la posizione da scegliere."""
    await current_user(request)
    termine = (q or "").strip()
    if len(termine) < 3:
        return []
    try:
        async with httpx.AsyncClient(timeout=6.0) as http:
            r = await http.get(
                "https://photon.komoot.io/api/",
                params={"q": termine, "limit": limit},
                headers={"User-Agent": "CineStudio/1.0 (ricerca luoghi)"},
            )
        dati = r.json() if r.status_code == 200 else {}
    except Exception:
        dati = {}

    uscita: list[dict] = []
    visti: set[str] = set()
    for f in dati.get("features") or []:
        props = f.get("properties") or {}
        coord = (f.get("geometry") or {}).get("coordinates") or []
        if len(coord) < 2:
            continue
        nome = props.get("name") or props.get("street") or ""
        if props.get("housenumber"):
            nome = f"{nome} {props['housenumber']}".strip()
        # Per un comune Photon mette il nome in "name" e non in "city".
        citta = props.get("city") or props.get("town") or props.get("village") or props.get("municipality") or ""
        if not citta and (props.get("type") in {"city", "town", "village", "municipality", "district", "county"} or props.get("osm_value") in {"city", "town", "village"}):
            citta = props.get("name") or ""
        if not citta:
            citta = props.get("county") or props.get("state") or ""
        regione = props.get("state") or props.get("country") or ""
        pezzi = [nome]
        if citta and citta.lower() != nome.lower():
            pezzi.append(citta)
        if regione and regione.lower() not in {nome.lower(), citta.lower()}:
            pezzi.append(regione)
        etichetta = ", ".join([x for x in pezzi if x]).strip()
        if not etichetta or etichetta in visti:
            continue
        visti.add(etichetta)
        uscita.append(
            {
                "label": etichetta[:120],
                "place": etichetta[:120],
                "city": str(citta)[:80],
                "lat": round(float(coord[1]), 6),
                "lng": round(float(coord[0]), 6),
            }
        )
    if uscita:
        return uscita[:limit]

    # Riserva: Nominatim (OpenStreetMap) se Photon non risponde o non trova nulla.
    try:
        async with httpx.AsyncClient(timeout=6.0) as http:
            r = await http.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": termine, "format": "jsonv2", "limit": limit, "accept-language": "it", "addressdetails": 1},
                headers={"User-Agent": "CineStudio/1.0 (ricerca luoghi)"},
            )
        risultati = r.json() if r.status_code == 200 else []
    except Exception:
        logging.warning("ricerca luoghi non disponibile")
        return []

    for item in risultati:
        indirizzo = item.get("address") or {}
        citta = indirizzo.get("city") or indirizzo.get("town") or indirizzo.get("village") or indirizzo.get("municipality") or indirizzo.get("county") or ""
        etichetta = (item.get("display_name") or "").strip()
        if not etichetta:
            continue
        uscita.append(
            {
                "label": etichetta[:120],
                "place": etichetta[:120],
                "city": str(citta)[:80],
                "lat": round(float(item.get("lat")), 6),
                "lng": round(float(item.get("lon")), 6),
            }
        )
    return uscita[:limit]


@api.get("/explore")
async def explore(
    request: Request,
    kind: str = Query("post"),
    limit: int = Query(30, ge=1, le=60),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: str = Query("", max_length=80),
    q: str = Query("", max_length=80),
):
    """I post pubblici degli altri: filmmaker (kind post) o noleggi (kind rental).

    Per i noleggi con `lat`/`lng` arrivano ordinati dal più vicino, con la
    distanza in km; `city` e `q` filtrano per città o per testo.
    """
    user = await current_user(request)
    tipo = kind if kind in POST_KINDS else "post"
    filtro: dict = {"privacy": "public", "kind": tipo, "author_id": {"$ne": user.user_id}}
    if city.strip():
        filtro["city"] = {"$regex": re.escape(city.strip()), "$options": "i"}
    if q.strip():
        like = {"$regex": re.escape(q.strip()), "$options": "i"}
        filtro["$or"] = [{"text": like}, {"place": like}, {"city": like}]

    docs = await db.posts.find(filtro, {"_id": 0}).sort([("created_at", -1)]).to_list(limit)

    if tipo == "rental" and lat is not None and lng is not None:
        docs.sort(key=lambda d: distanza_km(lat, lng, d["lat"], d["lng"]) if d.get("lat") is not None and d.get("lng") is not None else 99999)
    elif tipo == "rental":
        # Senza posizione: prima i noleggi della città del tuo rental.
        mia = ((user.rental or {}).get("citta") or "").strip().lower()
        if mia and not city.strip():
            docs.sort(key=lambda d: 0 if mia in str(d.get("city", "")).lower() or mia in str(d.get("place", "")).lower() else 1)

    fuori = await posts_out(docs, user)
    if tipo == "rental" and lat is not None and lng is not None:
        for p in fuori:
            if p.get("lat") is not None and p.get("lng") is not None:
                p["distance_km"] = distanza_km(lat, lng, p["lat"], p["lng"])
    return fuori


@api.get("/rentals")
async def rentals(
    request: Request,
    q: str = Query("", max_length=80),
    city: str = Query("", max_length=80),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = Query(30, ge=1, le=60),
):
    """Le attività rental, non i singoli annunci.

    Ogni rental arriva con i primi prodotti della sua vetrina. `q` cerca nel
    nome del rental, nella città, nell'attrezzatura descritta e nei titoli dei
    prodotti; `city` filtra per città. Con `lat`/`lng` l'ordine è dal più vicino.
    """
    user = await current_user(request)
    parole = q.strip().lower()
    zona = city.strip().lower()

    persone = await db.users.find(
        {"rental.nome": {"$exists": True, "$nin": [None, ""]}},
        {"_id": 0, "password": 0},
    ).to_list(500)
    if not persone:
        return []

    ids = [p.get("user_id") for p in persone if p.get("user_id")]
    annunci = await db.posts.find(
        {"kind": "rental", "privacy": "public", "author_id": {"$in": ids}},
        {"_id": 0},
    ).sort([("created_at", -1)]).to_list(1000)

    per_autore: dict = {}
    for d in annunci:
        per_autore.setdefault(d.get("author_id"), []).append(d)

    fuori: list[dict] = []
    for d in persone:
        r = d.get("rental") or {}
        if not str(r.get("nome") or "").strip():
            continue
        prodotti = per_autore.get(d.get("user_id"), [])
        testo_rental = " ".join(
            str(r.get(k) or "") for k in ("nome", "citta", "city", "attrezzatura", "note")
        ).lower()
        testi_prodotti = [
            " ".join(str(p.get(k) or "") for k in ("text", "price", "place", "city")).lower()
            for p in prodotti
        ]
        if parole and parole not in testo_rental and not any(parole in t for t in testi_prodotti):
            continue

        zona_rental = f"{r.get('citta') or ''} {r.get('city') or ''}".lower()
        zone_prodotti = " ".join(str(p.get("city") or "") for p in prodotti).lower()
        if zona and zona not in zona_rental and zona not in zone_prodotti:
            continue

        lat_r = r.get("lat")
        lng_r = r.get("lng")
        if (lat_r is None or lng_r is None) and prodotti:
            con_posizione = next(
                (p for p in prodotti if p.get("lat") is not None and p.get("lng") is not None),
                None,
            )
            if con_posizione:
                lat_r, lng_r = con_posizione.get("lat"), con_posizione.get("lng")

        distanza = None
        if lat is not None and lng is not None and lat_r is not None and lng_r is not None:
            distanza = distanza_km(lat, lng, float(lat_r), float(lng_r))

        fuori.append(
            {
                "user_id": d.get("user_id", ""),
                "username": d.get("username") or "",
                "name": d.get("name") or "",
                "picture": d.get("picture"),
                "rental": {
                    "nome": r.get("nome") or "",
                    "citta": r.get("citta") or r.get("city") or "",
                    "cover": r.get("cover") or "",
                    "attrezzatura": r.get("attrezzatura") or "",
                },
                "products": [
                    {
                        "id": p.get("id", ""),
                        "text": p.get("text") or "",
                        "price": p.get("price") or "",
                        "cover": (p.get("media") or [""])[0] or "",
                        "city": p.get("city") or "",
                    }
                    for p in prodotti[:3]
                ],
                "count": len(prodotti),
                "distance_km": distanza,
            }
        )

    if lat is not None and lng is not None:
        fuori.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 99999)
    else:
        mia = ((user.rental or {}).get("citta") or "").strip().lower()
        if mia and not zona:
            fuori.sort(
                key=lambda x: 0 if mia in str(x["rental"].get("citta", "")).lower() else 1
            )

    return fuori[:limit]


# ---- profili
@api.get("/users/{uid}")
async def get_profile(uid: str, request: Request):
    me = await current_user(request)
    d = await db.users.find_one({"user_id": uid}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Persona non trovata")
    persona = public_person(d)
    is_me = uid == me.user_id
    post_pubblici = await db.posts.count_documents({"author_id": uid, "privacy": "public"})
    post_miei = await db.posts.count_documents({"author_id": uid})
    followers = await db.follows.count_documents({"followee_id": uid})
    following = await db.follows.count_documents({"follower_id": uid})
    segue = bool(await db.follows.find_one({"follower_id": me.user_id, "followee_id": uid}, {"_id": 0, "follower_id": 1}))
    return {
        "user": {
            **persona,
            "rental": (d.get("rental") or {}) if (d.get("rental") or {}).get("nome") else {},
            "has_rental": bool((d.get("rental") or {}).get("nome")),
        },
        "posts": post_miei if is_me else post_pubblici,
        "followers": followers,
        "following": following,
        "is_me": is_me,
        "following_them": segue,
    }


@api.get("/users/{uid}/posts")
async def profile_posts(uid: str, request: Request, limit: int = Query(60, ge=1, le=120)):
    me = await current_user(request)
    if uid == me.user_id:
        filtro: dict = {"author_id": uid}
    else:
        # Di un'altra persona si vedono solo i post pubblici: né privati né non in elenco.
        filtro = {"author_id": uid, "privacy": "public"}
    docs = await db.posts.find(filtro, {"_id": 0}).sort([("created_at", -1)]).to_list(limit)
    return await posts_out(docs, me)


@api.get("/people/suggested")
async def suggested_people(request: Request, q: str = Query("", max_length=60), limit: int = Query(20, ge=1, le=40)):
    """Persone da seguire: prima chi ha più follower, poi gli iscritti di recente."""
    me = await current_user(request)
    gia = set(await following_ids(me))
    filtro: dict = {"user_id": {"$ne": me.user_id}}
    termine = normalize_username(q)
    if len(termine) >= 2:
        like = {"$regex": re.escape(termine), "$options": "i"}
        filtro["$or"] = [{"username": like}, {"name": like}]
    docs = await db.users.find(
        filtro,
        {"_id": 0, "user_id": 1, "username": 1, "name": 1, "picture": 1, "crew_role": 1},
    ).to_list(80)
    fuori: list[dict] = []
    for d in docs:
        if d["user_id"] in gia:
            continue
        n = await db.follows.count_documents({"followee_id": d["user_id"]})
        fuori.append({**public_person(d), "followers": n, "following": False})
    fuori.sort(key=lambda p: (-p["followers"], (p["username"] or p["name"] or "").lower()))
    return fuori[:limit]


# ---- messaggi
@api.get("/messages")
async def message_threads(request: Request):
    me = await current_user(request)
    docs = await db.messages.find(
        {"$or": [{"from_id": me.user_id}, {"to_id": me.user_id}]},
        {"_id": 0},
    ).sort([("created_at", -1)]).to_list(400)
    nonletti = 0
    visti: set[str] = set()
    fila: list[dict] = []
    for m in docs:
        altro = m["to_id"] if m["from_id"] == me.user_id else m["from_id"]
        if m["to_id"] == me.user_id and not m.get("read"):
            nonletti += 1
        if altro in visti:
            continue
        visti.add(altro)
        fila.append(
            {
                "user_id": altro,
                "text": m.get("text", ""),
                "post_id": m.get("post_id", ""),
                "from_me": m["from_id"] == me.user_id,
                "read": bool(m.get("read")),
                "created_at": iso(m["created_at"]) if m.get("created_at") else "",
            }
        )
    persone = await people_by_id([t["user_id"] for t in fila])
    for t in fila:
        t["user"] = persone.get(t["user_id"], {"user_id": t["user_id"], "username": "", "name": "Utente", "picture": None, "crew_role": ""})
    return {"unread": nonletti, "threads": fila}


@api.get("/messages/{uid}")
async def read_thread(uid: str, request: Request):
    me = await current_user(request)
    if not await db.users.find_one({"user_id": uid}, {"_id": 0, "user_id": 1}):
        raise HTTPException(404, "Persona non trovata")
    chiave = thread_key(me.user_id, uid)
    docs = await db.messages.find({"thread": chiave}, {"_id": 0}).sort([("created_at", 1)]).to_list(500)
    await db.messages.update_many({"thread": chiave, "to_id": me.user_id, "read": False}, {"$set": {"read": True}})
    # I post condivisi viaggiano come riferimento: qui si allega solo l'anteprima,
    # così la chat può mostrare miniatura e titolo senza una chiamata per messaggio.
    ids = list({d["post_id"] for d in docs if d.get("post_id")})
    post_brevi: dict[str, dict] = {}
    if ids:
        for p in await db.posts.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "media": 1, "text": 1}).to_list(len(ids)):
            prima = (p.get("media") or [None])[0]
            video = bool(prima) and str(prima).lower().rsplit(".", 1)[-1] in ("mp4", "mov", "m4v", "webm")
            post_brevi[p["id"]] = {
                "id": p["id"],
                "thumb": None if video else prima,
                "video": video,
                "text": (p.get("text") or "").split("\n")[0][:90],
            }
    # Risposte: si allega l'anteprima del messaggio citato, senza altre chiamate.
    per_id = {d["id"]: d for d in docs}
    fuori = []
    for d in docs:
        citato = per_id.get(d.get("reply_to") or "")
        voce = {
            "id": d["id"],
            "text": d.get("text", ""),
            "from_id": d["from_id"],
            "from_me": d["from_id"] == me.user_id,
            "created_at": iso(d["created_at"]) if d.get("created_at") else "",
            "post": post_brevi.get(d.get("post_id") or ""),
            "media": d.get("media") or [],
            "voice": d.get("voice") or "",
            "voice_durata": d.get("voice_durata") or 0,
            "reply": (
                {
                    "id": citato["id"],
                    "text": (citato.get("text") or "")[:120],
                    "from_me": citato["from_id"] == me.user_id,
                }
                if citato
                else None
            ),
            "reactions": d.get("reactions") or {},
        }
        fuori.append(voce)
    return fuori


@api.post("/messages/{uid}")
async def send_message(uid: str, body: MessageIn, request: Request):
    me = await current_user(request)
    if uid == me.user_id:
        raise HTTPException(400, "Non puoi scrivere a te stesso")
    if not await db.users.find_one({"user_id": uid}, {"_id": 0, "user_id": 1}):
        raise HTTPException(404, "Persona non trovata")
    testo = (body.text or "").strip()[:2000]
    post_id = (body.post_id or "").strip()
    if post_id and not await db.posts.find_one({"id": post_id}, {"_id": 0, "id": 1}):
        raise HTTPException(404, "Post non trovato")
    media = [str(m) for m in (body.media or []) if str(m).strip()][:6]
    voice = (body.voice or "").strip()
    if not testo and not post_id and not media and not voice:
        raise HTTPException(400, "Scrivi un messaggio")
    risposta = (body.reply_to or "").strip()
    if risposta:
        citato = await db.messages.find_one({"id": risposta, "thread": thread_key(me.user_id, uid)}, {"_id": 0, "id": 1})
        if not citato:
            risposta = ""
    doc = {
        "id": f"msg_{uuid.uuid4().hex[:12]}",
        "thread": thread_key(me.user_id, uid),
        "from_id": me.user_id,
        "to_id": uid,
        "text": testo,
        "post_id": post_id,
        "reply_to": risposta,
        "media": media,
        "voice": voice,
        "voice_durata": max(0.0, float(body.voice_durata or 0)),
        "reactions": {},
        "read": False,
        "created_at": now(),
    }
    await db.messages.insert_one(dict(doc))
    return {"id": doc["id"], "text": testo, "post_id": post_id, "created_at": iso(doc["created_at"])}


@api.delete("/messages/id/{mid}")
async def delete_direct_message(mid: str, request: Request):
    """Ognuno cancella i propri messaggi: restano solo per l'altra persona."""
    me = await current_user(request)
    doc = await db.messages.find_one({"id": mid}, {"_id": 0, "from_id": 1})
    if not doc:
        raise HTTPException(404, "Messaggio non trovato")
    if doc.get("from_id") != me.user_id:
        raise HTTPException(403, "Puoi eliminare solo i tuoi messaggi")
    await db.messages.delete_one({"id": mid})
    return {"ok": True}


@api.post("/messages/id/{mid}/react")
async def react_direct_message(mid: str, body: ReactionIn, request: Request):
    me = await current_user(request)
    emoji = (body.emoji or "").strip()
    if emoji not in CHAT_EMOJI:
        raise HTTPException(400, "Reazione non valida")
    doc = await db.messages.find_one({"id": mid}, {"_id": 0, "from_id": 1, "to_id": 1, "reactions": 1})
    if not doc or me.user_id not in (doc.get("from_id"), doc.get("to_id")):
        raise HTTPException(404, "Messaggio non trovato")
    reactions = {k: list(v) for k, v in (doc.get("reactions") or {}).items()}
    persone = reactions.get(emoji, [])
    reactions[emoji] = [u for u in persone if u != me.user_id] if me.user_id in persone else persone + [me.user_id]
    if not reactions[emoji]:
        reactions.pop(emoji, None)
    await db.messages.update_one({"id": mid}, {"$set": {"reactions": reactions}})
    return {"reactions": reactions}


# ---- chat di gruppo e chat di progetto

CHAT_EMOJI = ("👍", "❤️", "😂", "🔥", "👏", "👀")


async def chat_for(cid: str, user: User) -> dict:
    c = await db.chats.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Chat non trovata")
    if user.user_id not in (c.get("members") or []):
        raise HTTPException(403, "Non fai parte di questa chat")
    return c


def chat_out(c: dict, me: User, persone: dict) -> dict:
    membri = [persona for persona in (persone.get(uid) for uid in (c.get("members") or [])) if persona]
    puo_scrivere = not (c.get("can_send") or []) or me.user_id in (c.get("can_send") or [])
    return {
        "id": c["id"],
        "kind": c.get("kind") or "group",
        "name": c.get("name") or "Chat",
        "project_id": c.get("project_id") or "",
        "owner_id": c.get("owner_id") or "",
        "members": c.get("members") or [],
        "can_send": c.get("can_send") or [],
        "people": membri,
        "can_write": puo_scrivere,
        "can_manage": me.user_id == (c.get("owner_id") or ""),
        "created_at": iso(c["created_at"]) if c.get("created_at") else "",
    }


async def chat_messages_out(cid: str, me: User) -> list[dict]:
    docs = await db.chat_messages.find({"chat_id": cid, "deleted": {"$ne": True}}, {"_id": 0}).sort([("created_at", 1)]).to_list(600)
    persone = await people_by_id([d.get("from_id") for d in docs])
    per_id = {d["id"]: d for d in docs}
    fuori = []
    for d in docs:
        citato = per_id.get(d.get("reply_to") or "")
        fuori.append(
            {
                "id": d["id"],
                "text": d.get("text", ""),
                "from_id": d.get("from_id", ""),
                "from_me": d.get("from_id") == me.user_id,
                "from": persone.get(d.get("from_id"), {}),
                "created_at": iso(d["created_at"]) if d.get("created_at") else "",
                "media": d.get("media") or [],
                "voice": d.get("voice") or "",
                "voice_durata": d.get("voice_durata") or 0,
                "reparti": d.get("reparti") or [],
                "categoria": d.get("categoria") or "",
                "reply": (
                    {
                        "id": citato["id"],
                        "text": (citato.get("text") or "")[:120],
                        "from_me": citato.get("from_id") == me.user_id,
                    }
                    if citato
                    else None
                ),
                "reactions": d.get("reactions") or {},
            }
        )
    return fuori


@api.get("/chats")
async def my_chats(request: Request):
    me = await current_user(request)
    docs = await db.chats.find({"members": me.user_id}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    # difesa in piu: nell'elenco ogni chat compare una volta sola
    viste: set[str] = set()
    uniche = []
    for d in docs:
        if d.get("id") in viste:
            continue
        viste.add(d.get("id"))
        uniche.append(d)
    docs = uniche
    ids = [d.get("owner_id") for d in docs] + [uid for d in docs for uid in (d.get("members") or [])]
    persone = await people_by_id(ids)
    fuori = []
    for c in docs:
        ultimo = await db.chat_messages.find({"chat_id": c["id"], "deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(1)
        m = ultimo[0] if ultimo else None
        autori = await people_by_id([m.get("from_id")] if m else [])
        fuori.append(
            {
                **chat_out(c, me, persone),
                "last": (
                    {
                        "text": (m.get("text") or "")[:140],
                        "from_me": m.get("from_id") == me.user_id,
                        "from": autori.get(m.get("from_id"), {}),
                        "created_at": iso(m["created_at"]) if m.get("created_at") else "",
                    }
                    if m
                    else None
                ),
            }
        )
    return fuori


@api.post("/chats")
async def create_chat(body: ChatIn, request: Request):
    me = await current_user(request)
    membri = list(dict.fromkeys([me.user_id] + [uid for uid in body.members if uid and uid != me.user_id]))
    if len(membri) < 2:
        raise HTTPException(400, "Scegli almeno un'altra persona")
    esistenti = await db.users.count_documents({"user_id": {"$in": membri}})
    if esistenti != len(membri):
        raise HTTPException(404, "Una delle persone non esiste più")
    nome = (body.name or "").strip()[:60]
    if not nome:
        persone = await people_by_id([uid for uid in membri if uid != me.user_id])
        nome = ", ".join([(p.get("name") or p.get("username") or "").split(" ")[0] for p in persone.values() if p])[:60] or "Gruppo"
    cid = f"chat_{uuid.uuid4().hex[:12]}"
    doc = {
        "id": cid,
        "kind": "group",
        "name": nome,
        "owner_id": me.user_id,
        "project_id": "",
        "members": membri,
        "can_send": [],
        "created_at": now(),
        "updated_at": now(),
    }
    await db.chats.insert_one(dict(doc))
    return chat_out(doc, me, await people_by_id(membri))


@api.get("/chats/{cid}")
async def read_chat(cid: str, request: Request):
    me = await current_user(request)
    c = await chat_for(cid, me)
    if c.get("kind") == "project" and c.get("project_id"):
        await own_project(c["project_id"], me)
    return chat_out(c, me, await people_by_id((c.get("members") or []) + [c.get("owner_id")]))


@api.put("/chats/{cid}")
async def update_chat(cid: str, body: ChatIn, request: Request):
    me = await current_user(request)
    c = await chat_for(cid, me)
    if c.get("kind") == "project" and c.get("project_id"):
        await own_project(c["project_id"], me, manage=True)
    elif c.get("owner_id") != me.user_id:
        raise HTTPException(403, "Solo chi ha creato il gruppo lo può cambiare")
    membri = list(dict.fromkeys([uid for uid in body.members if uid] + [c.get("owner_id") or me.user_id]))
    if len(membri) < 2:
        raise HTTPException(400, "In una chat serve almeno un'altra persona")
    can_send = [uid for uid in body.can_send if uid in membri]
    aggiorna: dict = {"members": membri, "can_send": can_send, "updated_at": now()}
    if body.name.strip():
        aggiorna["name"] = body.name.strip()[:60]
    await db.chats.update_one({"id": cid}, {"$set": aggiorna})
    c = {**c, **aggiorna}
    return chat_out(c, me, await people_by_id(membri))


@api.delete("/chats/{cid}")
async def delete_chat(cid: str, request: Request):
    me = await current_user(request)
    c = await chat_for(cid, me)
    if c.get("kind") == "project" and c.get("project_id"):
        await own_project(c["project_id"], me, manage=True)
    elif c.get("owner_id") != me.user_id:
        raise HTTPException(403, "Solo chi ha creato il gruppo lo può eliminare")
    await db.chat_messages.delete_many({"chat_id": cid})
    await db.chats.delete_one({"id": cid})
    return {"ok": True}


@api.get("/chats/{cid}/messages")
async def read_chat_messages(cid: str, request: Request):
    me = await current_user(request)
    c = await chat_for(cid, me)
    if c.get("kind") == "project" and c.get("project_id"):
        await own_project(c["project_id"], me)
    return await chat_messages_out(cid, me)


@api.post("/chats/{cid}/messages")
async def send_chat_message(cid: str, body: ChatMessageIn, request: Request):
    me = await current_user(request)
    c = await chat_for(cid, me)
    if c.get("kind") == "project" and c.get("project_id"):
        await own_project(c["project_id"], me)
    if (c.get("can_send") or []) and me.user_id not in (c.get("can_send") or []):
        raise HTTPException(403, "In questa chat puoi leggere ma non scrivere")
    testo = (body.text or "").strip()[:2000]
    media = [str(m) for m in (body.media or []) if str(m).strip()][:6]
    voice = (body.voice or "").strip()
    if not testo and not media and not voice:
        raise HTTPException(400, "Scrivi un messaggio")
    risposta = (body.reply_to or "").strip()
    if risposta:
        citato = await db.chat_messages.find_one({"id": risposta, "chat_id": cid}, {"_id": 0, "id": 1})
        if not citato:
            risposta = ""
    doc = {
        "id": f"cmsg_{uuid.uuid4().hex[:12]}",
        "chat_id": cid,
        "from_id": me.user_id,
        "text": testo,
        "reply_to": risposta,
        "media": media,
        "voice": voice,
        "voice_durata": max(0.0, float(body.voice_durata or 0)),
        "reparti": [str(r) for r in (body.reparti or []) if str(r).strip()][:8],
        "categoria": (body.categoria or "").strip()[:40],
        "reactions": {},
        "created_at": now(),
    }
    await db.chat_messages.insert_one(dict(doc))
    await db.chats.update_one({"id": cid}, {"$set": {"updated_at": now()}})
    return {"id": doc["id"], "created_at": iso(doc["created_at"])}


@api.delete("/chats/{cid}/messages/{mid}")
async def delete_chat_message(cid: str, mid: str, request: Request):
    me = await current_user(request)
    await chat_for(cid, me)
    doc = await db.chat_messages.find_one({"id": mid, "chat_id": cid}, {"_id": 0, "from_id": 1})
    if not doc:
        raise HTTPException(404, "Messaggio non trovato")
    if doc.get("from_id") != me.user_id:
        raise HTTPException(403, "Puoi eliminare solo i tuoi messaggi")
    await db.chat_messages.update_one({"id": mid}, {"$set": {"deleted": True, "text": ""}})
    return {"ok": True}


@api.post("/chats/{cid}/messages/{mid}/react")
async def react_chat_message(cid: str, mid: str, body: ReactionIn, request: Request):
    me = await current_user(request)
    await chat_for(cid, me)
    emoji = (body.emoji or "").strip()
    if emoji not in CHAT_EMOJI:
        raise HTTPException(400, "Reazione non valida")
    doc = await db.chat_messages.find_one({"id": mid, "chat_id": cid}, {"_id": 0, "reactions": 1})
    if not doc:
        raise HTTPException(404, "Messaggio non trovato")
    reactions = {k: list(v) for k, v in (doc.get("reactions") or {}).items()}
    persone = reactions.get(emoji, [])
    reactions[emoji] = [u for u in persone if u != me.user_id] if me.user_id in persone else persone + [me.user_id]
    if not reactions[emoji]:
        reactions.pop(emoji, None)
    await db.chat_messages.update_one({"id": mid}, {"$set": {"reactions": reactions}})
    return {"reactions": reactions}


@api.get("/projects/{pid}/chat")
async def project_chat(pid: str, request: Request):
    """La chat del team: c'è sempre, si apre da sola la prima volta."""
    me = await current_user(request)
    p = await own_project(pid, me)
    membri = list(dict.fromkeys([p["owner_id"]] + [m.get("user_id") for m in (p.get("members") or []) if m.get("user_id")]))
    # Upsert atomico: se la chat non c'e la crea, se c'e la lascia com'e. Cosi
    # due richieste quasi simultanee non creano due chat dello stesso progetto.
    await db.chats.find_one_and_update(
        {"kind": "project", "project_id": pid},
        {
            "$setOnInsert": {
                "id": f"chat_{uuid.uuid4().hex[:12]}",
                "kind": "project",
                "name": f"Team · {p.get('title') or 'Progetto'}",
                "owner_id": p["owner_id"],
                "project_id": pid,
                "members": membri,
                "can_send": [],
                "created_at": now(),
                "updated_at": now(),
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    c = await db.chats.find_one({"kind": "project", "project_id": pid}, {"_id": 0})
    if me.user_id not in (c.get("members") or []):
        raise HTTPException(403, "Non fai parte della chat di questo progetto")
    return chat_out(c, me, await people_by_id((c.get("members") or []) + [c.get("owner_id")]))


@api.put("/projects/{pid}/chat")
async def update_project_chat(pid: str, body: ChatIn, request: Request):
    """Chi gestisce il progetto decide chi c'è e chi può scrivere."""
    me = await current_user(request)
    p = await own_project(pid, me, manage=True)
    c = await db.chats.find_one({"kind": "project", "project_id": pid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Chat non ancora creata: aprila una volta")
    disponibili = set([p["owner_id"]] + [m.get("user_id") for m in (p.get("members") or []) if m.get("user_id")])
    membri = [uid for uid in dict.fromkeys(body.members) if uid in disponibili]
    if p["owner_id"] not in membri:
        membri.insert(0, p["owner_id"])
    can_send = [uid for uid in body.can_send if uid in membri]
    aggiorna: dict = {"members": membri, "can_send": can_send, "updated_at": now()}
    if body.name.strip():
        aggiorna["name"] = body.name.strip()[:60]
    await db.chats.update_one({"id": c["id"]}, {"$set": aggiorna})
    c = {**c, **aggiorna}
    return chat_out(c, me, await people_by_id(membri))


class PdfIn(BaseModel):
    html: str = ""
    nome: str = "documento"


@api.post("/pdf")
async def render_pdf(body: PdfIn, request: Request):
    """Trasforma l'HTML di una sezione in PDF e lo salva: così si può allegare
    alla chat del team e aprirlo o scaricarlo da qualsiasi dispositivo."""
    user = await current_user(request)
    html = (body.html or "").strip()
    if not html:
        raise HTTPException(400, "Documento vuoto")
    if len(html) > 3_000_000:
        raise HTTPException(413, "Documento troppo grande")

    def build() -> Optional[bytes]:
        try:
            from xhtml2pdf import pisa

            buf = io.BytesIO()
            esito = pisa.CreatePDF(io.StringIO(html), dest=buf, encoding="utf-8")
            return None if esito.err else buf.getvalue()
        except Exception as e:
            logger.error("render_pdf: %s", e)
            return None

    data = await run_in_threadpool(build)
    if not data:
        raise HTTPException(503, "Il PDF non è stato generato, riprova tra poco")
    nome = re.sub(r"[^A-Za-z0-9._-]+", "-", (body.nome or "documento").strip())[:40] or "documento"
    key = f"pdf/{user.user_id}/{uuid.uuid4().hex[:10]}-{nome}.pdf"
    await run_in_threadpool(put_object, key, data, "application/pdf")
    return {"path": key, "nome": f"{nome}.pdf"}


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


# Le foto caricate da iPhone possono essere HEIC: iOS le mostra, Mac e browser
# no. Qui si convertono in JPEG al volo, così restano visibili ovunque anche
# quelle caricate prima che l'app convertisse all'invio.
_heic_cache: dict[str, bytes] = {}


def heic_to_jpeg(path: str, data: bytes) -> Optional[bytes]:
    if path in _heic_cache:
        return _heic_cache[path]
    try:
        from io import BytesIO

        import pillow_heif
        from PIL import Image

        pillow_heif.register_heif_opener()
        img = Image.open(BytesIO(data))
        img = img.convert("RGB")
        img.thumbnail((2400, 2400))
        out = BytesIO()
        img.save(out, "JPEG", quality=85, optimize=True)
        jpeg = out.getvalue()
    except Exception:
        return None

    if len(_heic_cache) > 40:
        _heic_cache.clear()
    _heic_cache[path] = jpeg
    return jpeg


@api.get("/files/{path:path}")
async def download(path: str, request: Request, token: Optional[str] = Query(None)):
    user = await user_from_token(bearer(request) or token)
    # Paths are unguessable; any signed-in collaborator of a shared project can view its files.
    rec = await db.files.find_one({"path": path}, {"_id": 0})
    if not rec or not user:
        raise HTTPException(404, "File non trovato")
    data, ctype = await run_in_threadpool(get_object, path)
    tipo = (rec.get("content_type") or ctype or "").lower()
    if tipo in ("image/heic", "image/heif") or path.lower().endswith((".heic", ".heif")):
        jpeg = await run_in_threadpool(heic_to_jpeg, path, data)
        if jpeg:
            return Response(
                content=jpeg,
                media_type="image/jpeg",
                headers={"Cache-Control": "private, max-age=86400"},
            )
    return Response(
        content=data,
        media_type=rec.get("content_type") or ctype,
        headers={"Cache-Control": "private, max-age=86400"},
    )


# ---------------------------------------------------------------- assistant (Gemini, con riserve gratuite)
# The Groq key lives only here, in backend/.env (GROQ_API_KEY). The app never sees it.
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
ASSISTANT_SYSTEM = (
    "Sei Boris, l'assistente di produzione di CineStudio, un'app per film, corti, serie e clip. "
    "Ti chiami Boris: se ti chiedono chi sei o come ti chiami, rispondi che sei Boris. "
    "Rispondi in italiano, in modo pratico e conciso. "
    "Parla come un collega di set esperto e cordiale: dai del tu, frasi brevi, tono caldo e concreto. "
    "Mai burocratico o robotico; non ripetere «come posso aiutarti?» a ogni messaggio, vai al punto. "
    "Se l'utente è indeciso, proponi una scelta concreta invece di fare altre domande."
    "Aiuti con sceneggiatura, shotlist, storyboard, piano di lavorazione, budget, ottiche e luci. "
    "Se ricevi dati dell'utente o dei progetti, usali per rispondere. "
    "Se ti chiedono del calendario, delle attività o di oggi, cerca le informazioni nel contesto fornito. "
    "Se un dato non è presente, dillo invece di inventarlo."
)
_assistant_hits: dict[str, list[float]] = {}


class AssistantMsg(BaseModel):
    role: str
    content: str = Field(max_length=4000)


class StrutturaSezione(BaseModel):
    key: str = Field(max_length=60)
    label: str = Field(default="", max_length=80)


class StrutturaCampo(BaseModel):
    key: str = Field(max_length=60)
    label: str = Field(default="", max_length=80)
    tipo: str = Field(default="text", max_length=20)


class StrutturaModulo(BaseModel):
    modulo: str = Field(max_length=60)
    etichetta: str = Field(default="", max_length=80)
    tipo: str = Field(default="list", max_length=20)
    sezioni: list[StrutturaSezione] = Field(default_factory=list, max_length=60)
    campi: list[StrutturaCampo] = Field(default_factory=list, max_length=60)


class AssistantIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[AssistantMsg] = Field(default_factory=list, max_length=40)
    project_id: Optional[str] = None
    struttura: list[StrutturaModulo] = Field(default_factory=list, max_length=120)


def _assistant_rate_ok(uid: str, limit: int = 20, window: float = 60.0) -> bool:
    """At most `limit` questions per user per `window` seconds, to protect the Groq quota."""
    t = time.monotonic()
    hits = [h for h in _assistant_hits.get(uid, []) if t - h < window]
    ok = len(hits) < limit
    if ok:
        hits.append(t)
    _assistant_hits[uid] = hits
    return ok

def _project_line(p: dict) -> str:
    return (
        f"{p.get('title', '')} | "
        f"tipo: {p.get('type', '')} | "
        f"stato: {p.get('status', '')}"
    )


def _item_line(project_title: str, item: dict) -> str:
    data = item.get("data") or {}
    data_text = json.dumps(data, ensure_ascii=False, default=str)
    return (
        f"{project_title} | "
        f"id={item.get('id', '')} | "
        f"{item.get('module', '')} | "
        f"{item.get('title', '')} | "
        f"{data_text}"
    )


def _struttura_line(m: dict) -> str:
    riga = f"{m['modulo']} («{m.get('etichetta') or m['modulo']}», {m.get('tipo', 'list')})"
    sezioni = [f"{s['key']}=«{s.get('label') or s['key']}»" for s in m.get("sezioni") or []]
    if sezioni:
        riga += " | sezioni: " + ", ".join(sezioni)
    campi = [f"{c['key']}=«{c.get('label') or c['key']}» ({c.get('tipo', 'text')})" for c in m.get("campi") or []]
    if campi:
        riga += " | campi: " + ", ".join(campi)
    return riga


AZIONI_ISTRUZIONI = (
    "\n\nPuoi anche MODIFICARE l'app per conto dell'utente: quando ti chiede di inserire, scrivere, aggiungere o aggiornare un testo, "
    "compila il campo azioni. Usa solo i moduli, le sezioni e i campi della struttura qui sopra; se il posto richiesto non esiste, "
    "non inventarlo: dillo nella risposta.\n"
    "Tipi di azione:\n"
    "- sezione: scrive in una sezione di un documento (tipo=doc). Servono modulo, sezione e testo.\n"
    "- nuovo_elemento: crea un elemento in una lista (tipo=list). Servono modulo, titolo e campi.\n"
    "- aggiorna_elemento: modifica un elemento esistente. Servono id (dall'elenco elementi) e campi, oppure sezione+testo.\n"
    "Se l'utente dice «aggiungi», «accoda» o «in fondo», metti aggiungi=true per accodare invece di sostituire.\n"
    "Nella risposta spiega in una frase cosa hai scritto e dove; se non c'è niente da modificare lascia azioni vuoto.\n"
    "Per modulo e sezione usa le chiavi esatte scritte a sinistra dell'uguale, non le etichette tra virgolette.\n"
    "Se l'utente chiede di scrivere qualcosa, restituisci almeno un'azione: non limitarti a dire di averlo fatto.\n"
    "Se non compili nessuna azione non dire di aver scritto o modificato qualcosa: scrivi che non hai modificato niente."
)


def build_assistant_messages(
    body: AssistantIn,
    project: Optional[dict],
    context: str = "",
) -> list[dict]:
    system = ASSISTANT_SYSTEM

    if project:
        system += "\n\nProgetto aperto dall'utente:\n"
        system += _project_line(project)

    if project and body.struttura:
        system += "\n\nStruttura modificabile del progetto (modulo | sezioni | campi):\n"
        system += "\n".join(_struttura_line(m.model_dump()) for m in body.struttura)
        system += AZIONI_ISTRUZIONI

    if context:
        system += "\n\nDati disponibili dell'utente e dei suoi progetti:\n"
        system += context
        system += "\n\nUsa questi dati quando rispondi. Non inventare informazioni assenti."

    msgs = [{"role": "system", "content": system}]

    for m in body.history[-10:]:
        if m.role in ("user", "assistant") and m.content.strip():
            msgs.append({"role": m.role, "content": m.content})

    msgs.append({"role": "user", "content": body.message})
    return msgs


# ---------------------------------------------------------------- assistant
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _gemini_messages(messages: list[dict]) -> tuple[str, list[dict]]:
    system_text = ""
    contents: list[dict] = []

    for message in messages:
        role = message.get("role")
        content = message.get("content", "")

        if role == "system":
            system_text += content + "\n\n"
        elif role == "user":
            contents.append(
                {
                    "role": "user",
                    "parts": [{"text": content}],
                }
            )
        elif role == "assistant":
            contents.append(
                {
                    "role": "model",
                    "parts": [{"text": content}],
                }
            )

    return system_text.strip(), contents


RISPOSTA_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "risposta": {"type": "STRING"},
        "azioni": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "tipo": {"type": "STRING", "enum": ["sezione", "nuovo_elemento", "aggiorna_elemento"]},
                    "modulo": {"type": "STRING"},
                    "sezione": {"type": "STRING"},
                    "id": {"type": "STRING"},
                    "titolo": {"type": "STRING"},
                    "testo": {"type": "STRING"},
                    "aggiungi": {"type": "BOOLEAN"},
                    "campi": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "chiave": {"type": "STRING"},
                                "valore": {"type": "STRING"},
                            },
                            "required": ["chiave", "valore"],
                        },
                    },
                },
                "required": ["tipo", "modulo"],
            },
        },
    },
    "required": ["risposta", "azioni"],
}


async def call_gemini(messages: list[dict], strutturata: bool = False) -> Optional[str]:
    if not GEMINI_API_KEY:
        logger.warning("Gemini non configurato: GEMINI_API_KEY mancante")
        return None

    system_text, contents = _gemini_messages(messages)

    if not contents:
        return None

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_text}]
        },
        "contents": contents,
        "generationConfig": _generation_config(strutturata),
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                GEMINI_URL.format(model=GEMINI_MODEL),
                headers={
                    "x-goog-api-key": GEMINI_API_KEY
                },
                json=payload,
            )
    except httpx.HTTPError as exc:
        logger.warning("Gemini errore di rete: %s", exc)
        return None

    if response.status_code >= 400:
        logger.warning(
            "Gemini errore %s: %s",
            response.status_code,
            response.text[:300],
        )
        return None

    try:
        parts = response.json()["candidates"][0]["content"]["parts"]
        reply = "".join(
            part.get("text", "") for part in parts
        )
        return reply.strip() or None
    except (KeyError, IndexError, TypeError, ValueError):
        logger.warning("Gemini risposta non valida")
        return None


def _testo(valore: Any) -> str:
    return str(valore if valore is not None else "").strip()[:20000]


def _campi_validi(definizione: dict, campi: Any) -> dict[str, Any]:
    """Tiene solo i campi previsti dal modulo e converte il valore nel tipo giusto."""
    if not isinstance(campi, list):
        return {}

    tipi = {c["key"]: c.get("tipo", "text") for c in definizione.get("campi") or []}
    valori: dict[str, Any] = {}

    for campo in campi[:40]:
        if not isinstance(campo, dict):
            continue
        chiave = str(campo.get("chiave", ""))[:60]
        if chiave not in tipi:
            continue

        tipo = tipi[chiave]
        valore = campo.get("valore")

        if tipo == "number":
            try:
                valori[chiave] = float(str(valore).replace(",", "."))
            except ValueError:
                continue
        elif tipo == "check":
            valori[chiave] = str(valore).strip().lower() in ("true", "sì", "si", "1", "yes")
        elif tipo in ("ref", "media", "image", "file", "colors"):
            # Riferimenti, immagini e file non si inventano: vanno scelti nell'app.
            continue
        else:
            valori[chiave] = _testo(valore)

    return valori


async def _crea_item(pid: str, modulo: str, titolo: str, data: dict[str, Any], owner_id: str) -> None:
    ultimo = await db.items.find({"project_id": pid, "module": modulo}, {"_id": 0, "order": 1}).sort("order", -1).limit(1).to_list(1)
    order = (ultimo[0]["order"] + 1) if ultimo else 1
    t = iso(now())
    item = Item(id=str(uuid.uuid4()), project_id=pid, module=modulo, title=titolo, data=data, order=order, created_at=t, updated_at=t)
    await db.items.insert_one({**item.model_dump(), "owner_id": owner_id})
    await db.projects.update_one({"id": pid}, {"$set": {"updated_at": t}})
    if modulo == "piano":
        await _sync_piano_evento(item.id, owner_id, getattr(item, "project_id", None), item.model_dump())


def _norm(valore: Any) -> str:
    """Chiave di confronto tollerante: minuscole, senza accenti e senza spazi."""
    testo = unicodedata.normalize("NFKD", str(valore or "")).encode("ascii", "ignore").decode("ascii")
    return "".join(c for c in testo.lower() if c.isalnum())


def _indice(righe: Any) -> dict[str, str]:
    """Mappa nome tollerante -> chiave vera, accettando sia la chiave sia l'etichetta."""
    indice: dict[str, str] = {}
    for riga in righe or []:
        if not isinstance(riga, dict):
            continue
        chiave = str(riga.get("key", ""))[:60]
        if not chiave:
            continue
        indice[_norm(chiave)] = chiave
        if riga.get("label"):
            indice.setdefault(_norm(riga["label"]), chiave)
    return indice


def _vero(valore: Any) -> bool:
    return str(valore).strip().lower() in ("true", "1", "si", "sì", "yes", "y")


def risposta_finale(risposta: str, fatte: list[str], rifiutate: list[str]) -> str:
    """La risposta all'utente deve dire la verità su cosa è stato scritto davvero."""
    if not rifiutate:
        return risposta or "Fatto."
    dettaglio = "; ".join(rifiutate[:3])
    if not fatte:
        return f"Non ho modificato niente: {dettaglio}. Dimmi il modulo e la sezione esatti e riprovo."
    return f"{risposta or 'Fatto.'}\n\nNon ho toccato: {dettaglio}."

# Verbi che indicano una richiesta di modifica: servono a non credere al modello
# quando racconta di aver scritto senza aver prodotto nessuna azione.
_VERBI_SCRITTURA = (
    "scriv", "inserisc", "aggiung", "metti", "aggiorna", "modifica", "salva",
    "compila", "corregg", "sostituisc", "complet", "riempi", "crea", "rinomina",
    "cancell", "togli",
)


def _chiede_di_scrivere(testo: str) -> bool:
    pulito = _norm(testo)
    return any(verbo in pulito for verbo in _VERBI_SCRITTURA)


def _estrai_dati(testo: str) -> dict:
    """Legge il JSON del modello anche se arriva in un blocco markdown o con testo attorno."""
    if not testo:
        return {}

    pulito = testo.strip()
    righe = pulito.splitlines()
    if righe and righe[0].strip().startswith("```"):
        righe = righe[1:]
    if righe and righe[-1].strip().startswith("```"):
        righe = righe[:-1]

    candidati = ["\n".join(righe).strip(), pulito]
    inizio, fine = pulito.find("{"), pulito.rfind("}")
    if inizio != -1 and fine > inizio:
        candidati.append(pulito[inizio:fine + 1])
    else:
        inizio, fine = pulito.find("["), pulito.rfind("]")
        if inizio != -1 and fine > inizio:
            candidati.append(pulito[inizio:fine + 1])

    for candidato in candidati:
        try:
            letto = json.loads(candidato)
        except ValueError:
            continue
        if isinstance(letto, dict):
            return letto
        if isinstance(letto, list):
            return {"azioni": letto, "risposta": ""}
    return {}


def _non_ho_scritto(dettaglio: str) -> dict:
    return {
        "reply": f"Non ho modificato niente: {dettaglio}. Riprova, oppure dimmi modulo e sezione esatti.",
        "azioni": [],
    }


async def _esegui_e_rispondi(
    dati: dict,
    project: Optional[dict],
    struttura: dict[str, dict],
    user: User,
    puo_scrivere: bool,
    messaggio: str,
) -> dict:
    """Unico punto in cui le azioni diventano modifiche vere, per Gemini e per Groq."""
    azioni_fatte: list[str] = []
    azioni_rifiutate: list[str] = []
    richieste = dati.get("azioni") or []

    if puo_scrivere and project and isinstance(richieste, list):
        azioni_fatte, azioni_rifiutate = await applica_azioni(project, richieste, struttura, user)
    elif isinstance(richieste, list) and richieste:
        azioni_rifiutate = ["non hai i permessi per modificare questo progetto"]

    if puo_scrivere and _chiede_di_scrivere(messaggio) and not azioni_fatte and not azioni_rifiutate:
        azioni_rifiutate = ["il modello non ha indicato quale sezione o campo modificare"]

    if azioni_rifiutate:
        logger.info(
            "assistant: %s azioni applicate, %s rifiutate (%s)",
            len(azioni_fatte),
            len(azioni_rifiutate),
            "; ".join(azioni_rifiutate)[:300],
        )

    risposta = str(dati.get("risposta") or "").strip()
    return {"reply": risposta_finale(risposta, azioni_fatte, azioni_rifiutate), "azioni": azioni_fatte}



async def applica_azioni(
    project: dict, azioni: list, struttura: dict[str, dict], user: User
) -> tuple[list[str], list[str]]:
    """Esegue le modifiche chieste all'assistente, solo su moduli e campi conosciuti.

    Ritorna (fatte, rifiutate): il motivo di ogni rifiuto serve a dire all'utente
    perché non è stato scritto niente, invece di rispondere "fatto" a vuoto.
    """
    fatte: list[str] = []
    rifiutate: list[str] = []
    pid = project["id"]

    # Il modello può usare la chiave o l'etichetta, in maiuscolo o con accenti:
    # normalizziamo il confronto invece di scartare l'azione in silenzio.
    moduli = {_norm(k): k for k in struttura}
    for chiave, defn in struttura.items():
        if defn.get("etichetta"):
            moduli.setdefault(_norm(defn["etichetta"]), chiave)

    for azione in azioni[:8]:
        if not isinstance(azione, dict):
            continue

        richiesto = azione.get("modulo", "")
        chiave_modulo = moduli.get(_norm(richiesto))
        definizione = struttura.get(chiave_modulo or "")
        if not definizione:
            rifiutate.append(f"il modulo «{richiesto}» non esiste in questo progetto")
            continue

        modulo = chiave_modulo or str(richiesto)[:60]
        tipo = _norm(azione.get("tipo", ""))
        if tipo in ("scrivisezione", "sezione"):
            tipo = "sezione"
        elif tipo in ("nuovoelemento", "creaelemento"):
            tipo = "nuovo_elemento"
        elif tipo in ("aggiornaelemento", "modificaelemento"):
            tipo = "aggiorna_elemento"
        etichetta = definizione.get("etichetta") or modulo

        if tipo not in ("sezione", "nuovo_elemento", "aggiorna_elemento"):
            rifiutate.append(
                f"tipo di azione «{azione.get('tipo')}» non riconosciuto: uso sezione, nuovo_elemento o aggiorna_elemento"
            )
            continue

        if tipo == "sezione":
            sezioni = {s["key"]: s.get("label") or s["key"] for s in definizione.get("sezioni") or []}
            etichette_sezioni = _indice(definizione.get("sezioni"))
            sezione = etichette_sezioni.get(_norm(azione.get("sezione")), "")
            testo = _testo(azione.get("testo", ""))
            if not testo and isinstance(azione.get("campi"), list):
                for campo in azione["campi"]:
                    if isinstance(campo, dict) and _testo(campo.get("valore")):
                        testo = _testo(campo.get("valore"))
                        break
            if not sezione:
                disponibili = ", ".join(sezioni.values())
                rifiutate.append(f"«{etichetta}» non ha la sezione «{azione.get('sezione')}» (ha: {disponibili})")
                continue
            if not testo:
                rifiutate.append(f"testo mancante per «{etichetta} › {sezioni.get(sezione, sezione)}»")
                continue

            doc = await db.items.find_one({"project_id": pid, "module": modulo}, {"_id": 0}, sort=[("order", 1)])
            if doc:
                data = dict(doc.get("data") or {})
                if _vero(azione.get("aggiungi")) and data.get(sezione):
                    data[sezione] = f"{str(data[sezione]).rstrip()}\n\n{testo}"
                else:
                    data[sezione] = testo
                await db.items.update_one({"id": doc["id"]}, {"$set": {"data": data, "updated_at": iso(now())}})
            else:
                await _crea_item(pid, modulo, etichetta, {sezione: testo}, user.user_id)

            if modulo == "soggetto" and sezione == "logline":
                await db.projects.update_one({"id": pid}, {"$set": {"logline": testo, "updated_at": iso(now())}})

            fatte.append(f"Scritto in {etichetta} › {sezioni[sezione]}")
            continue

        if tipo == "nuovo_elemento":
            if not definizione.get("campi"):
                rifiutate.append(f"«{etichetta}» è un documento: va scritto in una sezione, non come nuovo elemento")
                continue
            titolo = _testo(azione.get("titolo", ""))[:200] or etichetta
            campi = _campi_validi(definizione, azione.get("campi"))
            testo = _testo(azione.get("testo", ""))
            if testo:
                primo_lungo = next((c["key"] for c in definizione.get("campi") or [] if c.get("tipo") == "multiline" and c["key"] not in campi), None)
                if primo_lungo:
                    campi[primo_lungo] = testo
            if not campi:
                accettati = ", ".join(str(c.get("key")) for c in definizione.get("campi") or [])[:300]
                rifiutate.append(f"nessun campo riconosciuto per «{etichetta}» (accetta: {accettati})")
                continue
            await _crea_item(pid, modulo, titolo, campi, user.user_id)
            fatte.append(f"Creato in {etichetta}: {titolo}")
            continue

        if tipo == "aggiorna_elemento":
            iid = str(azione.get("id", ""))[:80]
            if not iid:
                rifiutate.append(f"elemento non indicato per «{etichetta}»")
                continue
            esistente = await db.items.find_one({"id": iid, "project_id": pid}, {"_id": 0})
            if not esistente:
                rifiutate.append(f"elemento {iid} non trovato in «{etichetta}»")
                continue

            data = dict(esistente.get("data") or {})
            data.update(_campi_validi(definizione, azione.get("campi")))
            sezione = str(azione.get("sezione", ""))[:60]
            testo = _testo(azione.get("testo", ""))
            if sezione and testo:
                data[sezione] = testo
            titolo = _testo(azione.get("titolo", ""))[:200] or esistente.get("title", "")

            await db.items.update_one({"id": iid}, {"$set": {"title": titolo, "data": data, "updated_at": iso(now())}})
            fatte.append(f"Aggiornato in {etichetta}: {titolo}")

    if fatte:
        await db.projects.update_one({"id": pid}, {"$set": {"updated_at": iso(now())}})

    return fatte, rifiutate


def _fornitori_riserva() -> list[tuple[str, str, str, str, Optional[str]]]:
    """Fornitori gratuiti compatibili OpenAI, provati in ordine dopo Gemini.

    L'ultimo valore è un modello di scorta: serve quando quello configurato non
    sa fare chat (per esempio i modelli "decisions" di OpenRouter, che non
    generano testo) o non accetta il JSON forzato.
    """
    elenco: list[tuple[str, str, str, str, Optional[str]]] = []

    if os.environ.get("GROQ_API_KEY"):
        elenco.append((
            "Groq",
            GROQ_URL,
            os.environ["GROQ_API_KEY"],
            os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b"),
            None,
        ))

    if os.environ.get("OPENROUTER_API_KEY"):
        elenco.append((
            "OpenRouter",
            os.environ.get("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions"),
            os.environ["OPENROUTER_API_KEY"],
            os.environ.get("OPENROUTER_MODEL", "openrouter/free"),
            "openrouter/free",
        ))

    return elenco


async def _invia_chat(
    nome: str,
    indirizzo: str,
    chiave: str,
    payload: dict,
) -> Optional[str]:
    headers = {"Authorization": f"Bearer {chiave}"}
    if nome == "OpenRouter":
        headers["HTTP-Referer"] = "https://cinestudio.app"
        headers["X-Title"] = "CineStudio Boris"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(indirizzo, headers=headers, json=payload)
    except httpx.HTTPError as exc:
        logger.warning("%s errore di rete: %s", nome, exc)
        return None

    if response.status_code >= 400:
        logger.warning(
            "%s errore %s: %s",
            nome,
            response.status_code,
            response.text[:300].replace(chiave, "***"),
        )
        return None

    try:
        reply = response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError):
        logger.warning("%s: risposta senza testo (modello non adatto alla chat?)", nome)
        return None

    return (reply or "").strip() or None


async def _chiama_openai_compat(
    nome: str,
    indirizzo: str,
    chiave: str,
    modello: str,
    messages: list[dict],
    puo_scrivere: bool,
    ripiego: Optional[str] = None,
) -> Optional[str]:
    def corpo(modello_usato: str, json_forzato: bool) -> dict:
        payload = {
            "model": modello_usato,
            "messages": messages,
            "temperature": 0.3 if puo_scrivere else 0.5,
            "max_tokens": 1200 if puo_scrivere else 700,
        }
        if puo_scrivere and json_forzato:
            # Il modello deve rispondere in JSON, altrimenti le azioni non si leggono.
            payload["response_format"] = {"type": "json_object"}
        return payload

    tentativi: list[tuple[str, bool]] = [(modello, True)]
    if ripiego and ripiego != modello:
        tentativi.append((ripiego, True))
    if puo_scrivere:
        tentativi.append((tentativi[-1][0], False))

    for modello_usato, json_forzato in tentativi:
        testo = await _invia_chat(
            nome, indirizzo, chiave, corpo(modello_usato, json_forzato)
        )
        if testo:
            if modello_usato != modello:
                logger.info(
                    "assistant: %s con %s non risponde, uso %s",
                    nome, modello, modello_usato,
                )
            elif not json_forzato:
                logger.info(
                    "assistant: %s con %s senza JSON forzato", nome, modello,
                )
            return testo

    return None


def _generation_config(strutturata: bool) -> dict:
    if strutturata:
        return {
            "temperature": 0.4,
            "maxOutputTokens": 1200,
            "responseMimeType": "application/json",
            "responseSchema": RISPOSTA_SCHEMA,
        }
    return {"temperature": 0.5, "maxOutputTokens": 700}


@api.post("/assistant")
async def assistant(body: AssistantIn, request: Request):
    user = await current_user(request)

    gemini_key = os.environ.get("GEMINI_API_KEY")
    riserve = _fornitori_riserva()

    if not gemini_key and not riserve:
        raise HTTPException(
            status_code=500,
            detail="Nessun provider AI configurato: manca GEMINI_API_KEY (oppure GROQ_API_KEY, oppure OPENROUTER_API_KEY)",
        )

    if not _assistant_rate_ok(user.user_id):
        raise HTTPException(
            429,
            "Troppe richieste, riprova tra un minuto"
        )

    project = (
        await own_project(body.project_id, user)
        if body.project_id
        else None
    )

    struttura = {m.modulo: m.model_dump() for m in body.struttura}
    puo_scrivere = False
    if project and struttura:
        try:
            await own_project(project["id"], user, write=True)
            puo_scrivere = True
        except HTTPException:
            puo_scrivere = False

    logger.info(
        "assistant: progetto=%s moduli=%s scrittura=%s",
        bool(body.project_id),
        len(struttura),
        puo_scrivere,
    )

    context_parts: list[str] = []
    context_parts.append(
        f"Oggi è: {datetime.now().astimezone().date().isoformat()}"
    )

    if project:
        context_parts.append("Progetto aperto:")
        context_parts.append(_project_line(project))

        items = await db.items.find(
            {"project_id": project["id"]},
            {"_id": 0, "owner_id": 0},
        ).sort(
            [("module", 1), ("order", 1)]
        ).to_list(300)

        for item in items:
            context_parts.append(
                _item_line(
                    project.get("title", ""),
                    item
                )
            )

    else:
        projects = await db.projects.find(
            {"$or": access_filter(user)},
            {
                "_id": 0,
                "id": 1,
                "title": 1,
                "type": 1,
                "status": 1,
            },
        ).to_list(100)

        project_ids = [
            project["id"] for project in projects
        ]

        title_by_id = {
            project["id"]: project.get("title", "")
            for project in projects
        }

        if project_ids:
            items = await db.items.find(
                {
                    "project_id": {
                        "$in": project_ids
                    }
                },
                {"_id": 0, "owner_id": 0},
            ).sort(
                [("module", 1), ("order", 1)]
            ).to_list(300)

            for item in items:
                project_title = title_by_id.get(
                    item.get("project_id"),
                    ""
                )
                context_parts.append(
                    _item_line(
                        project_title,
                        item
                    )
                )

    context = "\n".join(context_parts)

    # Limite ridotto per evitare il 413 di Groq
    context = context[:4000]

    if len(context) >= 4000:
        context += "\n\n[Contesto troncato per limiti del modello]"

    messages = build_assistant_messages(
        body,
        project,
        context
    )

    azioni_fatte: list[str] = []
    azioni_rifiutate: list[str] = []

    if gemini_key:
        grezza = await call_gemini(messages, strutturata=puo_scrivere)

        if grezza:
            dati = _estrai_dati(grezza)
            if not dati:
                logger.warning("assistant: risposta non leggibile (%s)", grezza[:300])
                if puo_scrivere and _chiede_di_scrivere(body.message):
                    return _non_ho_scritto("il modello non mi ha restituito una modifica valida")
                return {"reply": grezza, "azioni": []}

            return await _esegui_e_rispondi(
                dati, project, struttura, user, puo_scrivere, body.message
            )

    for nome, indirizzo, chiave, modello, ripiego in riserve:
        logger.info("assistant: Gemini non ha risposto, provo %s", nome)
        testo = await _chiama_openai_compat(
            nome, indirizzo, chiave, modello, messages, puo_scrivere, ripiego
        )
        if not testo:
            continue

        dati = _estrai_dati(testo)
        if dati:
            return await _esegui_e_rispondi(
                dati, project, struttura, user, puo_scrivere, body.message
            )

        logger.warning(
            "assistant: %s non ha restituito azioni leggibili (%s)",
            nome,
            testo[:300],
        )
        if puo_scrivere and _chiede_di_scrivere(body.message):
            return _non_ho_scritto(f"{nome} non mi ha restituito una modifica valida")
        return {"reply": testo, "azioni": []}

    raise HTTPException(
        502,
        "Boris è occupato su tutti i fornitori gratuiti: riprova tra un minuto.",
    )

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
    async def prepara_db() -> None:
        await dedupe_project_chats()
        await ensure_indexes()

    app.state.index_task = asyncio.create_task(prepara_db())
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
