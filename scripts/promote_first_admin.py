"""Promote one already-registered DRISHTI user to the single Superadmin role."""
from __future__ import annotations
import os
import sys
from datetime import datetime, timezone
import psycopg

def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/promote_first_admin.py <registered-email>")
        return 2
    dsn = os.environ.get("DATABASE_URL", "").strip()
    if not dsn:
        print("Set DATABASE_URL temporarily in your local shell. Never commit it.")
        return 2
    email = sys.argv[1].strip().lower()
    if "@" not in email:
        print("Provide a valid email address.")
        return 2
    try:
        with psycopg.connect(dsn, connect_timeout=10, prepare_threshold=None) as conn:
            # Serialise bootstrap attempts so two operators cannot create two Superadmins.
            conn.execute("SELECT pg_advisory_xact_lock(%s)", (741111026,))
            account = conn.execute("SELECT id FROM public.users WHERE lower(email) = %s", (email,)).fetchone()
            if account is None:
                print("Register this email in DRISHTI first, then rerun the script.")
                return 1
            existing = conn.execute("SELECT id FROM public.users WHERE role IN (%s, %s) LIMIT 1", ("admin", "superadmin")).fetchone()
            if existing is not None:
                print("A Superadmin already exists. Single-Superadmin bootstrap is locked.")
                return 1
            conn.execute("UPDATE public.users SET role = %s WHERE id = %s", ("superadmin", account[0]))
            conn.execute(
                """INSERT INTO public.admin_audit_log
                   (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                ("bootstrap-" + str(account[0]), account[0], "first_superadmin_bootstrap", "user", str(account[0]),
                 "{}", datetime.now(timezone.utc).isoformat()),
            )
        print("Superadmin role enabled for " + email + ". No password was generated or stored.")
        print("Sign in to the Superadmin Control Room with the password you chose during registration.")
        return 0
    except Exception as exc:
        print("Bootstrap failed: " + exc.__class__.__name__ + ". Check the private connection settings locally.")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
