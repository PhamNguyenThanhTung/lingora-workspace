import time
import jwt
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def valid_jwt_token():
    payload = {
        "sub": "b9751ad4-40fe-4e19-9abf-3d03b8e87bdf",
        "email": "test-learner@lingora.local",
        "role": "authenticated",
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def expired_jwt_token():
    payload = {
        "sub": "b9751ad4-40fe-4e19-9abf-3d03b8e87bdf",
        "email": "test-learner@lingora.local",
        "role": "authenticated",
        "exp": int(time.time()) - 3600
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def invalid_secret_jwt_token():
    payload = {
        "sub": "b9751ad4-40fe-4e19-9abf-3d03b8e87bdf",
        "email": "test-learner@lingora.local",
        "role": "authenticated",
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, "completely-wrong-secret-key-1234567890", algorithm="HS256")


@pytest.fixture
def missing_sub_jwt_token():
    payload = {
        "email": "test-learner@lingora.local",
        "role": "authenticated",
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def invalid_role_jwt_token():
    payload = {
        "sub": "b9751ad4-40fe-4e19-9abf-3d03b8e87bdf",
        "email": "test-anon@lingora.local",
        "role": "anon",
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def auth_headers(valid_jwt_token):
    return {"Authorization": f"Bearer {valid_jwt_token}"}
