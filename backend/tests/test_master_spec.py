import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding="utf-8")

import os
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8000")

def get(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    with urllib.request.urlopen(req, timeout=15) as res:
        return json.loads(res.read().decode("utf-8"))

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.loads(res.read().decode("utf-8"))

def run_master_verification():
    print("==================================================")
    print("      VEIL MASTER BUILD SPECIFICATION TESTS       ")
    print("==================================================")

    # 1. Health Checks
    print("\n[1/7] Testing Diagnostics: Health, Moss, Local AI...")
    health = get("/api/health")
    assert health["mode"] == "LOCAL_FIRST"
    print(f" - Health: {health['status']} | Mode: {health['mode']} | Files: {health['workspace']['total_files']}")

    moss_diag = get("/api/health/moss")
    assert moss_diag["ok"] is True
    print(f" - Moss: ok={moss_diag['ok']} | latency={moss_diag['latencyMs']}ms | docsFound={moss_diag['documentsFound']}")

    ai_diag = get("/api/health/ai")
    assert ai_diag["connected"] is True
    print(f" - Local AI: connected={ai_diag['connected']} | provider={ai_diag['provider']} | model={ai_diag['model']}")

    # 2. Demo 1: General AI (No Moss, No Internet)
    print("\n[2/7] DEMO 1 — General AI: 'What is React?'")
    res1 = post("/api/query", {"question": "What is React?", "mode": "AUTO"})
    print(f" - Routing: {res1['routing']['mode']}")
    print(f" - Moss Used: {res1['moss']['used']}")
    print(f" - Local AI: {res1['localAI']['model']} · {res1['localAI']['latencyMs']}ms")
    print(f" - Answer excerpt:\n   {res1['answer'][:120]}...")
    assert res1["routing"]["mode"] == "DIRECT"
    assert res1["moss"]["used"] is False
    assert res1["localAI"]["used"] is True
    assert "react" in res1["answer"].lower()
    print(" >>> DEMO 1 PASSED!")

    # 3. Demo 2: File Knowledge Retrieval (Uses Moss, Logs Access)
    print("\n[3/7] DEMO 2 — File Knowledge: 'What is the architecture in documentation.md?'")
    res2 = post("/api/query", {"question": "What is the architecture in documentation.md?", "mode": "FILES"})
    print(f" - Routing: {res2['routing']['mode']}")
    print(f" - Moss Used: {res2['moss']['used']} | Passages: {res2['moss']['passages']} · {res2['moss']['latencyMs']}ms")
    print(f" - Local AI Latency: {res2['localAI']['latencyMs']}ms")
    print(f" - Sources ({len(res2['sources'])}): {[s['title'] for s in res2['sources']]}")
    print(f" - Accessed Files: {[af['filename'] for af in res2['accessedFiles']]}")
    assert res2["routing"]["mode"] == "RETRIEVAL"
    assert res2["moss"]["used"] is True
    assert res2["moss"]["passages"] > 0
    assert len(res2["accessedFiles"]) > 0
    print(" >>> DEMO 2 PASSED!")

    # 4. Demo 3: Multi-File Comparison
    print("\n[4/7] DEMO 3 — Comparison: 'Compare server_alpha.txt and server_beta.txt'")
    res3 = post("/api/query", {"question": "Compare server_alpha.txt and server_beta.txt", "mode": "COMPARE"})
    print(f" - Routing: {res3['routing']['mode']}")
    print(f" - Moss Used: {res3['moss']['used']} | Passages: {res3['moss']['passages']}")
    print(f" - Accessed Files: {[af['filename'] for af in res3['accessedFiles']]}")
    assert res3["routing"]["mode"] == "COMPARISON"
    assert len(res3["accessedFiles"]) >= 2
    print(" >>> DEMO 3 PASSED!")

    # 5. Demo 4: Data Analysis (Deterministic Processing)
    print("\n[5/7] DEMO 4 — Data Analysis: 'Calculate the average in metrics.csv'")
    res4 = post("/api/query", {"question": "Calculate the average in metrics.csv", "mode": "AUTO"})
    print(f" - Routing: {res4['routing']['mode']}")
    print(f" - Local AI Latency: {res4['localAI']['latencyMs']}ms")
    print(f" - Answer excerpt:\n   {res4['answer'][:140]}...")
    assert res4["routing"]["mode"] in ["ANALYSIS", "RETRIEVAL"]
    print(" >>> DEMO 4 PASSED!")

    # 6. Demo 5: General + Local Context
    print("\n[6/7] DEMO 5 — General + Local Context: 'Explain recursion and compare with my notes'")
    res5 = post("/api/query", {"question": "Explain recursion and compare with my notes", "mode": "AUTO"})
    print(f" - Routing: {res5['routing']['mode']}")
    print(f" - Moss Used: {res5['moss']['used']}")
    print(f" - Local AI Latency: {res5['localAI']['latencyMs']}ms")
    assert "recursion" in res5["answer"].lower()
    print(" >>> DEMO 5 PASSED!")

    # 7. Local Analytics Audit Verification (Data Accessed Offline)
    print("\n[7/7] Verifying Activity Dashboard & 'DATA ACCESSED OFFLINE'...")
    analytics = get("/api/analytics")
    print(f" - Files Accessed: {analytics['files_accessed']}")
    print(f" - Offline Queries: {analytics['offline_queries']}")
    print(f" - Moss Retrievals: {analytics['moss_retrievals']}")
    print(f" - Local Analyses: {analytics['local_analyses']}")
    print(f" - Recent Access Logs ({len(analytics['recent_access'])}):")
    for ev in analytics["recent_access"][:4]:
        print(f"    * [{ev['action']}] {ev['filename']} ({ev.get('timeAgo', 'recent')})")
    print(f" - Most Accessed ({len(analytics['most_accessed'])}):")
    for ma in analytics["most_accessed"][:3]:
        print(f"    * {ma['filename']}: {ma['accessCount']} accesses")
    print(f" - Access Over Time ({len(analytics['access_over_time'])} days tracked): {[d['date'] + ':' + str(d['count']) for d in analytics['access_over_time']]}")

    assert analytics["files_accessed"] > 0
    assert analytics["offline_queries"] > 0
    assert len(analytics["recent_access"]) > 0
    print(" >>> AUDIT TRAIL VERIFIED!")

    print("\n==================================================")
    print("   ALL SPECIFICATION REQUIREMENTS VERIFIED 100%!  ")
    print("==================================================")

if __name__ == "__main__":
    run_master_verification()
