import pytest
import io
import json
from app.services.extraction_service import extract_and_preview_file

def test_csv_extraction_and_preview():
    csv_bytes = b"Name,Age,Role\nAlice,30,Engineer\nBob,25,Designer\nCharlie,35,Scientist"
    res = extract_and_preview_file("team.csv", csv_bytes)
    assert res["preview_type"] == "table"
    assert res["is_searchable"] is True
    assert res["preview_data"]["headers"] == ["Name", "Age", "Role"]
    assert len(res["preview_data"]["rows"]) == 3
    assert "Alice" in res["extracted_text"]

def test_json_extraction_and_preview():
    data = {"project": "VEIL", "features": ["Moss Retrieval", "Local AI", "Web Search"]}
    json_bytes = json.dumps(data).encode("utf-8")
    res = extract_and_preview_file("config.json", json_bytes)
    assert res["preview_type"] == "json"
    assert res["is_searchable"] is True
    assert "Moss Retrieval" in res["extracted_text"]

def test_code_extraction():
    code_bytes = b"def calculate_latency(start, end):\n    return (end - start) * 1000\n"
    res = extract_and_preview_file("timing.py", code_bytes)
    assert res["preview_type"] == "code"
    assert res["preview_data"]["language"] == "py"
    assert "calculate_latency" in res["extracted_text"]

def test_unsupported_binary_safe_handling():
    binary_bytes = bytes([0x00, 0xFF, 0x12, 0x34, 0x89, 0xFE, 0x00])
    res = extract_and_preview_file("firmware.bin", binary_bytes)
    assert res["preview_type"] == "unsupported"
    assert res["is_searchable"] is False
    assert res["extracted_text"] == ""
