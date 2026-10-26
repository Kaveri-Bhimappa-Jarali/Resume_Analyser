import os
import tempfile

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_register_login_flow():
    with tempfile.TemporaryDirectory() as temp_dir:
        email = "testuser@example.com"
        password = "password123"
        response = client.post("/api/auth/register", json={"name": "Test User", "email": email, "password": password})
        assert response.status_code == 200
        assert response.json()["data"]["user"]["email"] == email

        response = client.post("/api/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200
        assert response.json()["data"]["token"]["access_token"]
