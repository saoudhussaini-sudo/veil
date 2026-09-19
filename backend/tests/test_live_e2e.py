import requests
import json

def run_live_e2e():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Test CSV Upload
    csv_data = (
        "System,Retrieval_Latency_ms,Memory_MB,Grounded_Accuracy\n"
        "VEIL_Local_Moss,0.42,18.4,98.6%\n"
        "Traditional_Remote_VectorDB,384.2,450.0,89.1%\n"
        "Basic_BM25_FullScan,42.1,35.0,81.4%\n"
    )
    files = {"files": ("benchmark_report.csv", csv_data, "text/csv")}
    res = requests.post(f"{base_url}/api/files/upload", files=files)
    assert res.status_code == 200, f"Upload failed: {res.text}"
    uploaded = res.json()
    file_id = uploaded["files"][0]["id"]
    print("CSV uploaded successfully. File ID:", file_id)

    # 2. Test File Preview
    prev_res = requests.get(f"{base_url}/api/files/{file_id}/preview")
    assert prev_res.status_code == 200, f"Preview failed: {prev_res.text}"
    prev_data = prev_res.json()
    assert prev_data["preview_type"] == "table"
    assert "System" in prev_data["preview_data"]["columns"]
    assert len(prev_data["preview_data"]["rows"]) == 3
    print("Table preview verified. Columns:", prev_data["preview_data"]["columns"])
    print("Sample row:", prev_data["preview_data"]["rows"][0])

    # 3. Test Querying the newly uploaded CSV via Moss
    query_payload = {
        "question": "What is VEIL_Local_Moss retrieval latency in benchmark_report.csv?",
        "mode": "auto"
    }
    q_res = requests.post(f"{base_url}/api/query", json=query_payload)
    assert q_res.status_code == 200
    q_data = q_res.json()
    print("Query answer excerpt:", q_data["answer"][:150])
    print("Sources retrieved:", len(q_data["sources"]))
    print("ALL LIVE E2E TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_live_e2e()
