import asyncio
import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding='utf-8')
from app.storage.database import init_database, list_documents, log_access_event, get_analytics_summary
from app.services.local_ai_service import local_ai_service
from app.services.moss_service import moss_service
from app.services.file_service import file_service
from app.services.query_orchestrator import query_orchestrator
from app.services.analysis_service import analysis_service
from app.services.comparison_service import comparison_service

async def run_core_tests():
    print("--- 1. Initializing Local Database ---")
    init_database()
    print("Database initialized.")

    print("\n--- 2. Testing Phase 2: Local AI independently ('What is recursion?') ---")
    ans, lat, prov, model = await local_ai_service.generate("What is recursion?")
    print(f"Provider: {prov} | Model: {model} | Latency: {lat}ms")
    print(f"Answer excerpt:\n{ans[:160]}...")
    assert "recursion" in ans.lower()
    assert lat > 0
    print("Phase 2 Passed!")

    print("\n--- 3. Testing Phase 3 & 4: File Ingestion & Moss Indexing ---")
    test_doc = "VEIL_INTERNAL_DOC:\nThe primary offline encryption key codename is Project Starlight."
    f_info = await file_service.ingest_file("test_starlight.md", test_doc.encode("utf-8"))
    fid = f_info["id"]
    print(f"Ingested file: {f_info['original_name']} (ID: {fid})")

    # Query Moss directly
    docs, m_lat = await moss_service.query("Project Starlight", top_k=2)
    print(f"Moss Query retrieved {len(docs)} docs in {m_lat}ms")
    assert len(docs) > 0
    assert "Starlight" in docs[0]["text"]
    print("Phase 3 & 4 Passed!")

    print("\n--- 4. Testing Phase 5: Files -> Moss -> Local AI ---")
    res = await query_orchestrator.execute_query("What is the encryption key codename in my file?")
    print(f"Routing Mode: {res.routing.mode}")
    print(f"Moss used: {res.moss.used} | Passages: {res.moss.passages} | Latency: {res.moss.latencyMs}ms")
    print(f"Local AI latency: {res.localAI.latencyMs}ms")
    print(f"Answer excerpt:\n{res.answer[:160]}...")
    assert res.routing.mode == "RETRIEVAL"
    assert res.moss.passages > 0
    assert len(res.accessedFiles) > 0
    print("Phase 5 Passed!")

    print("\n--- 5. Testing Phase 6: General Question without Moss ---")
    res_gen = await query_orchestrator.execute_query("What is Python?")
    print(f"Routing Mode: {res_gen.routing.mode}")
    print(f"Moss used: {res_gen.moss.used}")
    print(f"Answer excerpt:\n{res_gen.answer[:160]}...")
    assert res_gen.routing.mode == "DIRECT"
    assert not res_gen.moss.used
    print("Phase 6 Passed!")

    print("\n--- 6. Testing Phase 7: Multi-File Comparison ---")
    f_a = await file_service.ingest_file("server_alpha.txt", b"Server Alpha uses Port 8080 and 4GB RAM.")
    f_b = await file_service.ingest_file("server_beta.txt", b"Server Beta uses Port 9090 and 8GB RAM.")
    res_comp = await query_orchestrator.execute_query(
        "Compare server_alpha.txt and server_beta.txt",
        mode="COMPARE",
        file_ids=[f_a["id"], f_b["id"]]
    )
    print(f"Routing Mode: {res_comp.routing.mode}")
    print(f"Accessed Files: {[af.filename for af in res_comp.accessedFiles]}")
    print(f"Answer excerpt:\n{res_comp.answer[:160]}...")
    assert res_comp.routing.mode == "COMPARISON"
    assert len(res_comp.accessedFiles) == 2
    print("Phase 7 Passed!")

    print("\n--- 7. Testing Phase 8: Local Analytics Engine ---")
    analytics = get_analytics_summary()
    print(f"Files Accessed: {analytics['files_accessed']}")
    print(f"Offline Queries: {analytics['offline_queries']}")
    print(f"Moss Retrievals: {analytics['moss_retrievals']}")
    print(f"Local Analyses: {analytics['local_analyses']}")
    print(f"Recent Access Events: {len(analytics['recent_access'])}")
    for ev in analytics["recent_access"][:3]:
        print(f" - [{ev['action']}] {ev['filename']} ({ev['timeAgo']})")
    assert analytics["files_accessed"] > 0
    assert analytics["offline_queries"] > 0
    assert len(analytics["recent_access"]) > 0
    print("Phase 8 Passed!")

    print("\n==================================================")
    print("     ALL CORE LOCAL INTELLIGENCE TESTS PASSED!    ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_core_tests())
