def test_invalid_json_body_returns_envelope(client, auth_headers):
    response = client.post(
        "/v1/srs/schedule",
        headers={**auth_headers, "Content-Type": "application/json"},
        content="invalid json string"
    )
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]
    assert data["error"]["code"] == "INVALID_INPUT"


def test_missing_required_fields_returns_envelope(client, auth_headers):
    response = client.post("/v1/chat/roleplay", headers=auth_headers, json={})
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "INVALID_INPUT"
    assert data["error"]["detail"] is not None


def test_404_unrouted_path_returns_envelope(client):
    response = client.get("/v1/unrouted_path")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_ERROR"
