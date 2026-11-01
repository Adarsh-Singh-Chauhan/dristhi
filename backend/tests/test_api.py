from fastapi.testclient import TestClient

from app import main as api


def test_register_analyze_history_and_delete(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DATABASE_URL", "")
    monkeypatch.setattr(api, "DATABASE_PATH", tmp_path / "drishti-test.db")
    monkeypatch.setattr(api, "JWT_SECRET_KEY", "test-only-secret-for-pytest")

    with TestClient(api.app) as client:
        registration = client.post(
            "/api/v1/auth/register",
            json={"email": "reader@example.com", "password": "strong-pass-123"},
        )
        assert registration.status_code == 201
        token = registration.json()["access_token"]
        headers = {"Authorization": "Bearer " + token}

        profile = client.get("/api/v1/auth/me", headers=headers)
        assert profile.status_code == 200
        assert profile.json()["email"] == "reader@example.com"

        analysis = client.post(
            "/api/v1/analyze",
            headers=headers,
            json={
                "content": "URGENT: Act now and forward this to everyone before it is too late!",
                "source_platform": "whatsapp",
                "save_to_history": True,
            },
        )
        assert analysis.status_code == 200
        assert analysis.json()["saved"] is True
        assert analysis.json()["priority"] in {"medium", "high"}

        history = client.get("/api/v1/history", headers=headers)
        assert history.status_code == 200
        assert len(history.json()) == 1
        analysis_id = history.json()[0]["id"]

        deleted = client.delete("/api/v1/history/" + analysis_id, headers=headers)
        assert deleted.status_code == 204

        history_after_delete = client.get("/api/v1/history", headers=headers)
        assert history_after_delete.status_code == 200
        assert history_after_delete.json() == []


def test_history_requires_authentication():
    with TestClient(api.app) as client:
        response = client.get("/api/v1/history")
        assert response.status_code == 401
