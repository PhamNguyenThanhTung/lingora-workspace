import jwt
from app.config import settings


def test_srs_missing_auth_header(client):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post("/v1/srs/schedule", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_chat_missing_auth_header(client):
    payload = {
        "scenario_code": "hotel_booking",
        "lang": "en",
        "user_message": "Hello"
    }
    response = client.post("/v1/chat/roleplay", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_auth_invalid_header_format(client):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": "Basic invalid_credentials"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_auth_expired_token(client, expired_jwt_token):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": f"Bearer {expired_jwt_token}"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["reason"] == "token_expired"


def test_auth_invalid_signature(client, invalid_secret_jwt_token):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": f"Bearer {invalid_secret_jwt_token}"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_auth_missing_sub_claim(client, missing_sub_jwt_token):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": f"Bearer {missing_sub_jwt_token}"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["claim"] == "sub"


def test_auth_invalid_role_claim(client, invalid_role_jwt_token):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": f"Bearer {invalid_role_jwt_token}"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["expected_role"] == "authenticated"


def test_auth_wrong_algorithm_rejected(client):
    # Craft token with HS512 or none
    token = jwt.encode(
        {"sub": "123", "role": "authenticated"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS512"
    )
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["expected_alg"] == "HS256"


def test_auth_valid_token_allows_access(client, auth_headers):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)
    assert response.status_code == 200
