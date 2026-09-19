import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage.db import init_db

client = TestClient(app)

def setup_module():
    init_db()

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert "moss" in data
    assert "llm" in data

def test_demo_load_and_query():
    # 1. Load demo documents
    demo_resp = client.post("/api/knowledge/demo")
    assert demo_resp.status_code == 200
    
    # 2. List documents
    list_resp = client.get("/api/knowledge")
    assert list_resp.status_code == 200
    assert list_resp.json()["total_documents"] >= 4

    # 3. Query
    query_resp = client.post("/api/query", json={"question": "What is the retrieval latency of Moss?"})
    assert query_resp.status_code == 200
    res = query_resp.json()
    assert "answer" in res
    assert "sources" in res
    assert res["retrievalLatency"] > 0
    assert len(res["sources"]) > 0
