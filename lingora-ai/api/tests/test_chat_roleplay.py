from app.config import settings


def test_chat_roleplay_valid(client, auth_headers):
    payload = {
        "scenario_code": "hotel_booking",
        "lang": "en",
        "history": [
            {"role": "ai", "content": "Welcome to Sunrise Hotel! How can I help you today?"}
        ],
        "user_message": "I want to book a room for two nights.",
        "client": "android/1.0.0"
    }

    response = client.post("/v1/chat/roleplay", headers=auth_headers, json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["ai_reply"] == "Sure! Could you tell me the check-in date you'd like?"
    assert data["model_version"] == "chat-t5small-v1.0.0"
    assert data["is_mock"] is True


def test_chat_roleplay_empty_message(client, auth_headers):
    payload = {
        "scenario_code": "hotel_booking",
        "lang": "en",
        "user_message": "   "
    }

    response = client.post("/v1/chat/roleplay", headers=auth_headers, json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "INVALID_INPUT"


def test_chat_roleplay_too_long(client, auth_headers):
    long_msg = "A" * 501
    payload = {
        "scenario_code": "hotel_booking",
        "lang": "en",
        "user_message": long_msg
    }

    response = client.post("/v1/chat/roleplay", headers=auth_headers, json=payload)
    assert response.status_code == 413
    data = response.json()
    assert data["error"]["code"] == "TEXT_TOO_LONG"
    assert data["error"]["detail"]["max_chars"] == 500


def test_chat_roleplay_unsupported_lang(client, auth_headers):
    payload = {
        "scenario_code": "hotel_booking",
        "lang": "vi",
        "user_message": "Tôi muốn đặt phòng"
    }

    response = client.post("/v1/chat/roleplay", headers=auth_headers, json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "LANG_NOT_SUPPORTED"


def test_chat_roleplay_scenario_not_found(client, auth_headers):
    payload = {
        "scenario_code": "airport_customs",
        "lang": "en",
        "user_message": "Where is passport control?"
    }

    response = client.post("/v1/chat/roleplay", headers=auth_headers, json=payload)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "SCENARIO_NOT_FOUND"


def test_chat_roleplay_mock_mode_false_unavailable(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    payload = {
        "scenario_code": "hotel_booking",
        "lang": "en",
        "user_message": "I want to book a room."
    }

    response = client.post("/v1/chat/roleplay", headers=auth_headers, json=payload)
    assert response.status_code == 503
    data = response.json()
    assert data["error"]["code"] == "MODEL_UNAVAILABLE"
