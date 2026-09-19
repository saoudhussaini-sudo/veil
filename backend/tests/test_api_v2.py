import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage.file_storage import init_file_database

client = TestClient(app)

def setup_module():
    init_file_database()

def test_health_and_search_status():
    r1 = client.get("/api/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "HEALTHY"
    assert "search" in r1.json()
    assert "local_ai" in r1.json()

    r2 = client.get("/api/search/status")
    assert r2.status_code == 200
    assert r2.json()["active"] is True

def test_file_upload_and_preview():
    # Upload CSV file
    csv_content = b"Metric,Value\nRecall,0.95\nPrecision,0.92\nLatency,4.5ms"
    response = client.post(
        "/api/files/upload",
        files=[("files", ("metrics.csv", csv_content, "text/csv"))]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert len(data["files"]) == 1
    file_id = data["files"][0]["id"]

    # Get preview
    p_resp = client.get(f"/api/files/{file_id}/preview")
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert p_data["preview_type"] == "table"
    assert p_data["preview_data"]["headers"] == ["Metric", "Value"]

    # Query with the new file
    q_resp = client.post(
        "/api/query",
        json={"question": "What is the measured latency in metrics.csv?", "mode": "files"}
    )
    assert q_resp.status_code == 200
    q_data = q_resp.json()
    assert "answer" in q_data
    assert q_data["retrieval"]["provider"] == "moss"
