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
    assert "HS256" in data["error"]["detail"]["expected_alg"]


def test_auth_valid_token_allows_access(client, auth_headers):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post("/v1/srs/schedule", headers=auth_headers, json=payload)
    assert response.status_code == 200


def test_auth_valid_es256_token_allows_access(client):
    from unittest.mock import MagicMock, patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    mock_key = MagicMock()
    mock_key.key = public_key

    token = jwt.encode(
        {
            "sub": "b9751ad4-40fe-4e19-9abf-3d03b8e87bdf",
            "email": "test-es256-learner@lingora.local",
            "role": "authenticated",
            "exp": int(time.time()) + 3600
        },
        private_key,
        algorithm="ES256",
        headers={"kid": "mock-supabase-kid-1"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", return_value=mock_key):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data


def test_auth_es256_missing_kid_rejected(client):
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    token = jwt.encode(
        {"sub": "user-123", "role": "authenticated", "exp": int(time.time()) + 3600},
        private_key,
        algorithm="ES256"
        # No kid header
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
    assert data["error"]["detail"]["reason"] == "missing_kid"


def test_auth_es256_unknown_kid_rejected(client):
    from unittest.mock import patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    token = jwt.encode(
        {"sub": "user-123", "role": "authenticated", "exp": int(time.time()) + 3600},
        private_key,
        algorithm="ES256",
        headers={"kid": "unknown-nonexistent-kid"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", side_effect=jwt.PyJWKClientError("Key not found")):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["reason"] == "jwks_key_not_found"


def test_auth_es256_invalid_signature_rejected(client):
    from unittest.mock import MagicMock, patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    signer_private_key = ec.generate_private_key(ec.SECP256R1())
    different_private_key = ec.generate_private_key(ec.SECP256R1())
    different_public_key = different_private_key.public_key()

    mock_key = MagicMock()
    mock_key.key = different_public_key

    token = jwt.encode(
        {"sub": "user-123", "role": "authenticated", "exp": int(time.time()) + 3600},
        signer_private_key,
        algorithm="ES256",
        headers={"kid": "mock-kid-1"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", return_value=mock_key):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["reason"] == "invalid_signature"


def test_auth_es256_expired_token_rejected(client):
    from unittest.mock import MagicMock, patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    mock_key = MagicMock()
    mock_key.key = public_key

    token = jwt.encode(
        {"sub": "user-123", "role": "authenticated", "exp": int(time.time()) - 3600},
        private_key,
        algorithm="ES256",
        headers={"kid": "mock-kid-1"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", return_value=mock_key):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["reason"] == "token_expired"


def test_auth_es256_missing_sub_rejected(client):
    from unittest.mock import MagicMock, patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    mock_key = MagicMock()
    mock_key.key = public_key

    token = jwt.encode(
        {"role": "authenticated", "exp": int(time.time()) + 3600},
        private_key,
        algorithm="ES256",
        headers={"kid": "mock-kid-1"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", return_value=mock_key):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["claim"] == "sub"


def test_auth_es256_invalid_role_rejected(client):
    from unittest.mock import MagicMock, patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    mock_key = MagicMock()
    mock_key.key = public_key

    token = jwt.encode(
        {"sub": "user-123", "role": "anon", "exp": int(time.time()) + 3600},
        private_key,
        algorithm="ES256",
        headers={"kid": "mock-kid-1"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", return_value=mock_key):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["expected_role"] == "authenticated"


def test_auth_es256_jwks_unavailable_fails_closed(client):
    from unittest.mock import patch
    from cryptography.hazmat.primitives.asymmetric import ec
    import time

    private_key = ec.generate_private_key(ec.SECP256R1())
    token = jwt.encode(
        {"sub": "user-123", "role": "authenticated", "exp": int(time.time()) + 3600},
        private_key,
        algorithm="ES256",
        headers={"kid": "mock-kid-1"}
    )

    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    with patch.object(jwt.PyJWKClient, "get_signing_key_from_jwt", side_effect=Exception("Connection refused")):
        response = client.post(
            "/v1/srs/schedule",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["detail"]["reason"] == "jwks_unavailable"


def test_auth_algorithm_none_rejected(client):
    # Unsecured token with alg=none
    token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjMiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9."
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_auth_malformed_token_string_rejected(client):
    payload = {"items": [{"vocabulary_id": "1069c152-a9f6-54e3-93d0-b488fc7e44e8"}]}
    response = client.post(
        "/v1/srs/schedule",
        headers={"Authorization": "Bearer not-a-valid-jwt-token-structure"},
        json=payload
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
