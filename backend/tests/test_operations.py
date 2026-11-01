from fastapi.testclient import TestClient

from app import main as api


def test_sos_trusted_contacts_alerts_and_admin_review(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DATABASE_URL", "")
    monkeypatch.setattr(api, "DATABASE_PATH", tmp_path / "operations-test.db")
    monkeypatch.setattr(api, "JWT_SECRET_KEY", "test-only-secret-for-pytest")

    with TestClient(api.app) as client:
        registration = client.post(
            "/api/v1/auth/register",
            json={"email": "owner@example.com", "password": "strong-pass-123"},
        )
        assert registration.status_code == 201
        token = registration.json()["access_token"]
        headers = {"Authorization": "Bearer " + token}

        profile = client.get("/api/v1/auth/me", headers=headers)
        assert profile.status_code == 200
        assert profile.json()["role"] == "user"
        assert client.get("/api/v1/admin/overview", headers=headers).status_code == 403

        contact = client.post(
            "/api/v1/trusted-contacts",
            headers=headers,
            json={"name": "Trusted person", "email": "trusted@example.com"},
        )
        assert contact.status_code == 201
        contact_id = contact.json()["id"]

        sos = client.post(
            "/api/v1/sos",
            headers=headers,
            json={
                "title": "Urgent public information review",
                "details": "A message is circulating with an unverified public safety claim.",
                "urgency": "urgent",
                "trusted_contact_ids": [contact_id],
            },
        )
        assert sos.status_code == 201
        sos_data = sos.json()
        assert sos_data["status"] == "open"
        assert sos_data["selected_trusted_contacts"] == 1
        assert sos_data["external_contact_delivery"] is False

        my_sos = client.get("/api/v1/sos/mine", headers=headers)
        assert my_sos.status_code == 200
        assert my_sos.json()[0]["id"] == sos_data["id"]

        alerts = client.get("/api/v1/alerts", headers=headers)
        assert alerts.status_code == 200
        sos_alert = next(item for item in alerts.json() if item["category"] == "sos")
        assert sos_alert["source_id"] == sos_data["id"]
        marked = client.post("/api/v1/alerts/" + sos_alert["id"] + "/read", headers=headers)
        assert marked.status_code == 200

        # Promote the registered user within the isolated test database.
        with api.database() as connection:
            connection.execute("UPDATE users SET role = ? WHERE id = ?", ("admin", profile.json()["id"]))

        overview = client.get("/api/v1/admin/overview", headers=headers)
        assert overview.status_code == 200
        assert overview.json()["open_sos"] == 1

        queue = client.get("/api/v1/admin/sos", headers=headers)
        assert queue.status_code == 200
        assert queue.json()[0]["reporter_email"] == "owner@example.com"

        reviewed = client.patch(
            "/api/v1/admin/sos/" + sos_data["id"],
            headers=headers,
            json={"status": "under_review", "review_notes": "Source evidence is being checked."},
        )
        assert reviewed.status_code == 200
        assert reviewed.json()["status"] == "under_review"

        published = client.post(
            "/api/v1/admin/alerts",
            headers=headers,
            json={
                "title": "Reviewed notice",
                "message": "A reviewer has published an informational notice for users.",
                "level": "info",
                "category": "reviewed_notice",
            },
        )
        assert published.status_code == 201
        visible_alerts = client.get("/api/v1/alerts", headers=headers)
        assert any(item["title"] == "Reviewed notice" for item in visible_alerts.json())
