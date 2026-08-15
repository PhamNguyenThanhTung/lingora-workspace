from app.config import settings


def test_srs_schedule_valid(client, auth_headers):
    vocab_id = "1069c152-a9f6-54e3-93d0-b488fc7e44e8"
    payload = {
        "now": "2026-08-15T12:00:00Z",
        "items": [
            {
                "vocabulary_id": vocab_id,
                "ease_factor": 2.5,
                "history": [
                    {"is_correct": True, "interval_days": 1.0, "reviewed_at": "2026-08-10T10:00:00Z"}
                ]
            }
        ],
        "client": "android/1.0.0"
    }

    response = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "predictions" in data
    assert len(data["predictions"]) == 1
    pred = data["predictions"][0]
    assert pred["vocabulary_id"] == vocab_id
    assert 0.0 <= pred["recall_probability"] <= 1.0
    assert pred["priority"] in ["REVIEW_NOW", "REVIEW_TODAY", "REVIEW_LATER"]
    assert pred["recommended_interval_days"] > 0
    assert data["model_version"] == "mock-srs-v1"
    assert data["scheduler_version"] == "mock-rule-v1"
    assert data["is_mock"] is True


def test_srs_schedule_determinism_three_seed_fixtures(client, auth_headers):
    # 3 stable vocabulary UUIDs from M1.4 seed
    fixtures = [
        "1069c152-a9f6-54e3-93d0-b488fc7e44e8",
        "94761f7d-47be-5cb4-996b-11a90a1a5b0a",
        "16462719-74d1-58dc-b52b-7b001d2d0b50"
    ]
    payload = {
        "items": [{"vocabulary_id": vid, "ease_factor": 2.5} for vid in fixtures]
    }

    res1 = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)
    res2 = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)

    assert res1.status_code == 200
    assert res2.status_code == 200
    preds1 = res1.json()["predictions"]
    preds2 = res2.json()["predictions"]

    assert len(preds1) == 3
    assert len(preds2) == 3

    for p1, p2 in zip(preds1, preds2):
        assert p1["vocabulary_id"] == p2["vocabulary_id"]
        assert p1["recall_probability"] == p2["recall_probability"]
        assert p1["priority"] == p2["priority"]
        assert p1["recommended_interval_days"] == p2["recommended_interval_days"]


def test_srs_schedule_empty_items(client, auth_headers):
    payload = {"items": []}
    response = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "INVALID_INPUT"


def test_srs_schedule_mock_mode_false_unavailable(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)
    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "MODEL_UNAVAILABLE"
