import pytest
from app.moss.client import moss_client, MossDocItem

@pytest.mark.asyncio
async def test_moss_index_and_query():
    test_index = "test-veil-index"
    docs = [
        MossDocItem(id="1", text="Moss provides sub-10ms semantic retrieval across indexed documents.", metadata={"source": "moss-overview.md"}),
        MossDocItem(id="2", text="VEIL prevents sensitive documents from leaking to external cloud LLMs.", metadata={"source": "privacy.md"}),
        MossDocItem(id="3", text="FastAPI powers the high-throughput local backend services.", metadata={"source": "architecture.md"})
    ]

    create_res = await moss_client.create_index(test_index, docs)
    assert create_res["status"] in ["SUCCESS", "FALLBACK_LOCAL"]

    await moss_client.load_index(test_index)

    query_res = await moss_client.query(test_index, "How fast is Moss retrieval?", top_k=2)
    assert query_res.retrieved_count > 0
    assert query_res.time_taken_ms > 0
    assert "sub-10ms" in query_res.docs[0].text or "Moss" in query_res.docs[0].text
