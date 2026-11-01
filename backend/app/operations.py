"""DRISHTI alerts, trusted contacts, SOS workflow and admin endpoints."""
from __future__ import annotations

import json
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field


def initialize_operations_schema(connection: Any, is_postgres: bool) -> None:
    """Create the additive operations schema for either SQLite or PostgreSQL."""
    if is_postgres:
        connection.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'"
        )
    else:
        columns = connection.execute("PRAGMA table_info(users)").fetchall()
        if "role" not in {row["name"] for row in columns}:
            connection.execute(
                "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'"
            )

    statements = [
        """CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            level TEXT NOT NULL DEFAULT 'info',
            category TEXT NOT NULL DEFAULT 'system',
            source_id TEXT,
            created_at TEXT NOT NULL,
            read_at TEXT
        )""",
        """CREATE TABLE IF NOT EXISTS trusted_contacts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            created_at TEXT NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS sos_reports (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            details TEXT NOT NULL,
            source_url TEXT,
            urgency TEXT NOT NULL DEFAULT 'high',
            status TEXT NOT NULL DEFAULT 'open',
            trusted_contact_ids_json TEXT NOT NULL DEFAULT '[]',
            review_notes TEXT,
            reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS admin_audit_log (
            id TEXT PRIMARY KEY,
            actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        )""",
        "CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON alerts(user_id, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_contacts_user ON trusted_contacts(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_sos_status_created ON sos_reports(status, created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC)",
    ]
    for statement in statements:
        connection.execute(statement)


class TrustedContactInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=32)


class SOSCreate(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    details: str = Field(min_length=10, max_length=4000)
    source_url: str | None = Field(default=None, max_length=2048)
    urgency: Literal["normal", "high", "urgent"] = "high"
    trusted_contact_ids: list[str] = Field(default_factory=list, max_length=5)


class SOSReview(BaseModel):
    status: Literal["open", "under_review", "resolved", "dismissed"]
    review_notes: str = Field(default="", max_length=2000)


class AdminAlertCreate(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    message: str = Field(min_length=10, max_length=4000)
    level: Literal["info", "medium", "high"] = "info"
    category: Literal["system", "reviewed_notice"] = "reviewed_notice"
    target_user_id: str | None = None


def _plain(row: Any) -> dict:
    return dict(row)


def build_operations_router(
    database,
    require_user,
    require_admin,
    utc_now,
) -> APIRouter:
    router = APIRouter()

    @router.get("/api/v1/alerts", tags=["Alerts"])
    def list_alerts(user: Any = Depends(require_user)) -> list[dict]:
        with database() as connection:
            rows = connection.execute(
                """SELECT id, user_id, title, message, level, category, source_id, created_at, read_at
                   FROM alerts
                   WHERE user_id = ? OR user_id IS NULL
                   ORDER BY created_at DESC LIMIT 100""",
                (user["id"],),
            ).fetchall()
        return [_plain(row) for row in rows]

    @router.post("/api/v1/alerts/{alert_id}/read", tags=["Alerts"])
    def mark_alert_read(alert_id: str, user: Any = Depends(require_user)) -> dict:
        now = utc_now()
        with database() as connection:
            cursor = connection.execute(
                "UPDATE alerts SET read_at = ? WHERE id = ? AND user_id = ?",
                (now, alert_id, user["id"]),
            )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found.")
        return {"status": "read", "alert_id": alert_id}

    @router.get("/api/v1/trusted-contacts", tags=["SOS"])
    def list_trusted_contacts(user: Any = Depends(require_user)) -> list[dict]:
        with database() as connection:
            rows = connection.execute(
                """SELECT id, name, email, phone, created_at
                   FROM trusted_contacts WHERE user_id = ? ORDER BY created_at DESC""",
                (user["id"],),
            ).fetchall()
        return [_plain(row) for row in rows]

    @router.post("/api/v1/trusted-contacts", status_code=201, tags=["SOS"])
    def add_trusted_contact(payload: TrustedContactInput, user: Any = Depends(require_user)) -> dict:
        name = payload.name.strip()
        email = payload.email.strip().lower() if payload.email else None
        phone = payload.phone.strip() if payload.phone else None
        if not email and not phone:
            raise HTTPException(status_code=422, detail="Add an email address or phone number.")
        if email and ("@" not in email or len(email) > 254):
            raise HTTPException(status_code=422, detail="Enter a valid email address.")
        if phone and len(phone) < 7:
            raise HTTPException(status_code=422, detail="Enter a valid phone number.")
        contact_id = str(uuid.uuid4())
        created_at = utc_now()
        with database() as connection:
            count = connection.execute(
                "SELECT COUNT(*) AS total FROM trusted_contacts WHERE user_id = ?",
                (user["id"],),
            ).fetchone()["total"]
            if count >= 5:
                raise HTTPException(status_code=409, detail="You can save up to five trusted contacts.")
            connection.execute(
                """INSERT INTO trusted_contacts(id, user_id, name, email, phone, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (contact_id, user["id"], name, email, phone, created_at),
            )
        return {
            "id": contact_id, "name": name, "email": email, "phone": phone,
            "created_at": created_at,
        }

    @router.delete("/api/v1/trusted-contacts/{contact_id}", status_code=204, response_model=None, tags=["SOS"])
    def delete_trusted_contact(contact_id: str, user: Any = Depends(require_user)) -> None:
        with database() as connection:
            cursor = connection.execute(
                "DELETE FROM trusted_contacts WHERE id = ? AND user_id = ?",
                (contact_id, user["id"]),
            )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Trusted contact not found.")

    @router.post("/api/v1/sos", status_code=201, tags=["SOS"])
    def submit_sos(payload: SOSCreate, user: Any = Depends(require_user)) -> dict:
        selected_ids = list(dict.fromkeys(payload.trusted_contact_ids))
        if len(selected_ids) > 5:
            raise HTTPException(status_code=422, detail="Select no more than five trusted contacts.")
        with database() as connection:
            for contact_id in selected_ids:
                found = connection.execute(
                    "SELECT id FROM trusted_contacts WHERE id = ? AND user_id = ?",
                    (contact_id, user["id"]),
                ).fetchone()
                if found is None:
                    raise HTTPException(status_code=422, detail="One selected trusted contact is not available.")
            report_id = str(uuid.uuid4())
            now = utc_now()
            connection.execute(
                """INSERT INTO sos_reports(
                    id, user_id, title, details, source_url, urgency, status,
                    trusted_contact_ids_json, review_notes, reviewed_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, NULL, NULL, ?, ?)""",
                (
                    report_id, user["id"], payload.title.strip(), payload.details.strip(),
                    payload.source_url, payload.urgency, json.dumps(selected_ids), now, now,
                ),
            )
            connection.execute(
                """INSERT INTO alerts(id, user_id, title, message, level, category, source_id, created_at, read_at)
                   VALUES (?, ?, ?, ?, 'high', 'sos', ?, ?, NULL)""",
                (
                    str(uuid.uuid4()), user["id"], "SOS request submitted",
                    "Your SOS request has been placed in the DRISHTI review queue.",
                    report_id, now,
                ),
            )
        return {
            "id": report_id,
            "status": "open",
            "message": "Your SOS request has been submitted to the DRISHTI review queue.",
            "selected_trusted_contacts": len(selected_ids),
            "external_contact_delivery": False,
        }

    @router.get("/api/v1/sos/mine", tags=["SOS"])
    def list_my_sos(user: Any = Depends(require_user)) -> list[dict]:
        with database() as connection:
            rows = connection.execute(
                """SELECT id, title, details, source_url, urgency, status,
                          trusted_contact_ids_json, review_notes, created_at, updated_at
                   FROM sos_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 100""",
                (user["id"],),
            ).fetchall()
        items = []
        for row in rows:
            item = _plain(row)
            item["trusted_contact_ids"] = json.loads(item.pop("trusted_contact_ids_json") or "[]")
            items.append(item)
        return items

    @router.get("/api/v1/admin/overview", tags=["Administration"])
    def admin_overview(user: Any = Depends(require_admin)) -> dict:
        with database() as connection:
            users = connection.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]
            open_sos = connection.execute(
                "SELECT COUNT(*) AS total FROM sos_reports WHERE status IN ('open', 'under_review')"
            ).fetchone()["total"]
            total_sos = connection.execute("SELECT COUNT(*) AS total FROM sos_reports").fetchone()["total"]
            alerts = connection.execute("SELECT COUNT(*) AS total FROM alerts").fetchone()["total"]
        return {"users": users, "open_sos": open_sos, "total_sos": total_sos, "alerts": alerts}

    @router.get("/api/v1/admin/sos", tags=["Administration"])
    def admin_list_sos(user: Any = Depends(require_admin)) -> list[dict]:
        with database() as connection:
            rows = connection.execute(
                """SELECT s.id, s.title, s.details, s.source_url, s.urgency, s.status,
                          s.trusted_contact_ids_json, s.review_notes, s.created_at,
                          s.updated_at, u.email AS reporter_email
                   FROM sos_reports s
                   JOIN users u ON u.id = s.user_id
                   ORDER BY s.created_at DESC LIMIT 200"""
            ).fetchall()
        items = []
        for row in rows:
            item = _plain(row)
            item["trusted_contact_ids"] = json.loads(item.pop("trusted_contact_ids_json") or "[]")
            items.append(item)
        return items

    @router.patch("/api/v1/admin/sos/{report_id}", tags=["Administration"])
    def admin_review_sos(report_id: str, payload: SOSReview, user: Any = Depends(require_admin)) -> dict:
        now = utc_now()
        with database() as connection:
            cursor = connection.execute(
                """UPDATE sos_reports
                   SET status = ?, review_notes = ?, reviewed_by = ?, updated_at = ?
                   WHERE id = ?""",
                (payload.status, payload.review_notes.strip(), user["id"], now, report_id),
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="SOS report not found.")
            connection.execute(
                """INSERT INTO admin_audit_log
                   (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()), user["id"], "review_sos", "sos_report",
                    report_id, json.dumps({"status": payload.status}), now,
                ),
            )
        return {"id": report_id, "status": payload.status, "updated_at": now}

    @router.get("/api/v1/admin/alerts", tags=["Administration"])
    def admin_list_alerts(user: Any = Depends(require_admin)) -> list[dict]:
        with database() as connection:
            rows = connection.execute(
                """SELECT id, user_id, title, message, level, category, source_id, created_at
                   FROM alerts ORDER BY created_at DESC LIMIT 200"""
            ).fetchall()
        return [_plain(row) for row in rows]

    @router.post("/api/v1/admin/alerts", status_code=201, tags=["Administration"])
    def admin_create_alert(payload: AdminAlertCreate, user: Any = Depends(require_admin)) -> dict:
        alert_id = str(uuid.uuid4())
        now = utc_now()
        with database() as connection:
            if payload.target_user_id:
                target = connection.execute(
                    "SELECT id FROM users WHERE id = ?", (payload.target_user_id,)
                ).fetchone()
                if target is None:
                    raise HTTPException(status_code=404, detail="Target user not found.")
            connection.execute(
                """INSERT INTO alerts(id, user_id, title, message, level, category, source_id, created_at, read_at)
                   VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL)""",
                (
                    alert_id, payload.target_user_id, payload.title.strip(),
                    payload.message.strip(), payload.level, payload.category, now,
                ),
            )
            connection.execute(
                """INSERT INTO admin_audit_log
                   (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()), user["id"], "create_alert", "alert", alert_id,
                    json.dumps({"level": payload.level, "category": payload.category}), now,
                ),
            )
        return {"id": alert_id, "created_at": now}

    return router
