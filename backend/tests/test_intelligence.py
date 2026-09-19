import pytest
from app.services.query_orchestrator import query_orchestrator
from app.services.web_search_service import web_search_service

def test_intent_classification():
    # 1. Local file question
    i1 = query_orchestrator.classify_intent("What does my uploaded PDF say about privacy?")
    assert i1["intent"] == "LOCAL_FILES"
    assert i1["search_files"] is True
    assert i1["search_web"] is False

    # 2. Web search question
    i2 = query_orchestrator.classify_intent("What is the latest version of React and what changed?")
    assert i2["intent"] == "WEB_SEARCH"
    assert i2["search_web"] is True

    # 3. Comparison question
    i3 = query_orchestrator.classify_intent("Compare document A with document B and find differences.")
    assert i3["intent"] == "COMPARISON"
    assert i3["mode"] == "comparison"

    # 4. Fact check question
    i4 = query_orchestrator.classify_intent("Is the information in my report still accurate with current online research?")
    assert i4["intent"] == "FACT_CHECK"
    assert i4["search_files"] is True
    assert i4["search_web"] is True

@pytest.mark.asyncio
async def test_web_search_and_scrape():
    # Test real web search retrieval
    results = await web_search_service.search("what is moss semantic search", max_results=3)
    assert isinstance(results, list)
    # Even if offline, normalized structure is maintained
    if results:
        assert "title" in results[0]
        assert "url" in results[0]
        assert "snippet" in results[0]

@pytest.mark.asyncio
async def test_full_query_pipeline():
    res = await query_orchestrator.process_query("What are the product pillars of VEIL?", mode_override="files")
    assert "answer" in res
    assert "sources" in res
    assert "retrieval" in res
    assert res["retrieval"]["provider"] == "moss"
    assert res["retrieval"]["latencyMs"] >= 0
