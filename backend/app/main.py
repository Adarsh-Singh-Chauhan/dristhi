"""DRISHTI API: authentication, explainable analysis and saved history."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.analyzer import analyze_text

APP_VERSION = "0.1.0"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "data/drishti.db"))
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(48)
ACCESS_TOKEN_TTL_MINUTES = max(5, int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "60")))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://127.0.0.1:5500,http://localhost:5500").split(",")
    if origin.strip()
]

app = FastAPI(
    title="DRISHTI API",
    summary="Explainable information-integrity signal analysis with human verification.",
    description="A prototype API for reviewing user-submitted text. The baseline engine surfaces selected wording and link patterns; it does not determine truth or classify political viewpoints.",
    version=APP_VERSION,
    openapi_tags=[
        {"name": "Health", "description": "Service availability."},
        {"name": "Authentication", "description": "Account creation and bearer-token login."},
        {"name": "Analysis", "description": "Transparent review-priority signal analysis."},
        {"name": "History", "description": "Private saved analysis records."},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
bearer_scheme = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: str


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    content: str = Field(min_length=20, max_length=10000)
    source_platform: Literal["whatsapp", "instagram", "telegram", "facebook", "x", "web", "other"] = "other"
    source_url: HttpUrl | None = None
    save_to_history: bool = True


class AnalysisResponse(BaseModel):
    analysis_id: str | None = None
    score: int
    priority: str
    label: str
    summary: str
    indicators: list[dict]
    recommended_checks: list[str]
    method: str
    disclaimer: str
    saved: bool


class HistoryItem(BaseModel):
    id: str
    source_platform: str
    source_url: str | None
    content_excerpt: str
    score: int
    priority: str
    indicators: list[dict]
    created_at: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PostgresConnectionAdapter:
    """Keep the small SQL surface compatible with the SQLite prototype."""

    def __init__(self, connection):
        self.connection = connection

    def execute(self, statement: str, params=()):
        return self.connection.execute(statement.replace("?", "%s"), params)

    def executescript(self, script: str) -> None:
        for statement in script.split(";"):
            if statement.strip():
                self.execute(statement)


@contextmanager
def database():
    if DATABASE_URL:
        import psycopg
        from psycopg.rows import dict_row

        with psycopg.connect(DATABASE_URL, row_factory=dict_row, connect_timeout=10) as raw_connection:
            yield PostgresConnectionAdapter(raw_connection)
        return

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = Any
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database() -> None:
    with database() as connection:
        if DATABASE_URL:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    source_platform TEXT NOT NULL,
                    source_url TEXT,
                    content_excerpt TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    priority TEXT NOT NULL,
                    indicators_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(user_id, created_at DESC)"
            )
        else:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    source_platform TEXT NOT NULL,
                    source_url TEXT,
                    content_excerpt TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    priority TEXT NOT NULL,
                    indicators_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_analyses_user_created
                ON analyses(user_id, created_at DESC);
                """
            )

@app.on_event("startup")
def on_startup() -> None:
    initialize_database()


def b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=64)
    return "scrypt$16384$8$1$" + b64url_encode(salt) + "$" + b64url_encode(digest)


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_text, digest_text = encoded.split("$")
        if algorithm != "scrypt":
            return False
        expected = b64url_decode(digest_text)
        actual = hashlib.scrypt(
            password.encode("utf-8"), salt=b64url_decode(salt_text),
            n=int(n), r=int(r), p=int(p), dklen=len(expected),
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str) -> str:
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": user_id, "iat": now, "exp": now + ACCESS_TOKEN_TTL_MINUTES * 60}
    signing_input = "{}.{}".format(
        b64url_encode(json.dumps(header, separators=(",", ":")).encode()),
        b64url_encode(json.dumps(payload, separators=(",", ":")).encode()),
    )
    signature = hmac.new(JWT_SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
    return signing_input + "." + b64url_encode(signature)


def decode_access_token(token: str) -> str:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = header_part + "." + payload_part
        expected = hmac.new(JWT_SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, b64url_decode(signature_part)):
            raise ValueError("Invalid token signature")
        header = json.loads(b64url_decode(header_part))
        payload = json.loads(b64url_decode(payload_part))
        if header.get("alg") != "HS256" or int(payload.get("exp", 0)) <= int(time.time()):
            raise ValueError("Expired or unsupported token")
        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise ValueError("Invalid token subject")
        return subject
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Any | None:
    if credentials is None:
        return None
    user_id = decode_access_token(credentials.credentials)
    with database() as connection:
        user = connection.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    if user is None:
        raise HTTPException(status_code=401, detail="Account no longer exists.")
    return user


def require_user(user: Any | None = Depends(get_optional_user)) -> Any:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "service": "drishti-api", "version": APP_VERSION}


@app.post("/api/v1/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register(payload: RegisterRequest) -> TokenResponse:
    email = payload.email.lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    user_id = str(uuid.uuid4())
    created_at = utc_now()
    try:
        with database() as connection:
            connection.execute(
                "INSERT INTO users(id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (user_id, email, hash_password(payload.password), created_at),
            )
    except Exception as exc:
        if isinstance(exc, sqlite3.IntegrityError) or exc.__class__.__name__ in {"IntegrityError", "UniqueViolation"}:
            raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
        raise
    return TokenResponse(access_token=create_access_token(user_id), expires_in=ACCESS_TOKEN_TTL_MINUTES * 60)


@app.post("/api/v1/auth/login", response_model=TokenResponse, tags=["Authentication"])
def login(payload: LoginRequest) -> TokenResponse:
    with database() as connection:
        user = connection.execute(
            "SELECT id, password_hash FROM users WHERE email = ? COLLATE NOCASE",
            (payload.email.lower(),),
        ).fetchone()
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenResponse(access_token=create_access_token(user["id"]), expires_in=ACCESS_TOKEN_TTL_MINUTES * 60)


@app.get("/api/v1/auth/me", response_model=UserResponse, tags=["Authentication"])
def me(user: Any = Depends(require_user)) -> UserResponse:
    return UserResponse(id=user["id"], email=user["email"], created_at=user["created_at"])


@app.post("/api/v1/analyze", response_model=AnalysisResponse, tags=["Analysis"])
def analyze(payload: AnalysisRequest, user: Any | None = Depends(get_optional_user)) -> AnalysisResponse:
    content = payload.content.strip()
    if len(content) < 20:
        raise HTTPException(status_code=422, detail="Please provide at least 20 characters.")
    result = analyze_text(content)
    analysis_id = None
    saved = False
    if user is not None and payload.save_to_history:
        analysis_id = str(uuid.uuid4())
        with database() as connection:
            connection.execute(
                """INSERT INTO analyses(
                    id, user_id, source_platform, source_url, content_excerpt,
                    score, priority, indicators_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    analysis_id, user["id"], payload.source_platform,
                    str(payload.source_url) if payload.source_url else None,
                    content[:220], result["score"], result["priority"],
                    json.dumps(result["indicators"], ensure_ascii=False), utc_now(),
                ),
            )
        saved = True
    return AnalysisResponse(
        analysis_id=analysis_id, score=result["score"], priority=result["priority"],
        label=result["label"], summary=result["summary"], indicators=result["indicators"],
        recommended_checks=result["recommended_checks"], method=result["method"],
        disclaimer=result["disclaimer"], saved=saved,
    )


@app.get("/api/v1/history", response_model=list[HistoryItem], tags=["History"])
def list_history(user: Any = Depends(require_user)) -> list[HistoryItem]:
    with database() as connection:
        rows = connection.execute(
            """SELECT id, source_platform, source_url, content_excerpt, score,
                      priority, indicators_json, created_at
               FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 100""",
            (user["id"],),
        ).fetchall()
    return [
        HistoryItem(
            id=row["id"], source_platform=row["source_platform"], source_url=row["source_url"],
            content_excerpt=row["content_excerpt"], score=row["score"], priority=row["priority"],
            indicators=json.loads(row["indicators_json"]), created_at=row["created_at"],
        )
        for row in rows
    ]


@app.delete("/api/v1/history/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None, tags=["History"])
def delete_history_item(analysis_id: str, user: Any = Depends(require_user)) -> None:
    with database() as connection:
        cursor = connection.execute(
            "DELETE FROM analyses WHERE id = ? AND user_id = ?", (analysis_id, user["id"])
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Analysis not found.")
