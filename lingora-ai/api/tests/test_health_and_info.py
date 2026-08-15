from app.config import settings


def test_health_live(client):
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_health_ready_mock_mode_true(client, monkeypatch):
    monkeypatch.setattr(settings, "MOCK_MODE", True)
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["srs_ready"] is True
    assert data["nlp_ready"] is True
    assert data["mock_mode"] is True


def test_health_ready_mock_mode_false(client, monkeypatch):
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    response = client.get("/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["srs_ready"] is False
    assert data["nlp_ready"] is False
    assert data["mock_mode"] is False


def test_health_root_alias(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"


def test_model_info(client):
    response = client.get("/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) == 2
    tasks = [m["task"] for m in data["models"]]
    assert "srs_prediction" in tasks
    assert "roleplay_chat" in tasks
    assert all(m["is_mock"] is True for m in data["models"])
