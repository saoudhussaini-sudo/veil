import os
import sys
import json
import time
import urllib.request
import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

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

def create_sample_pdf(filename="test.pdf"):
    """Creates a genuine 7-page PDF with specific text on page 7."""
    doc = pymupdf.open()
    for i in range(1, 8):
        page = doc.new_page()
        if i == 7:
            text = (
                "VEIL Architecture - Page 7\n\n"
                "On page 7, local retrieval is defined as an in-process, sub-millisecond "
                "semantic memory layer built on the Moss SDK. Unlike remote SaaS vectors, "
                "local retrieval computes similarity directly inside device RAM in 0.3ms to 1.2ms. "
                "All user vectors remain private, air-gapped, and local."
            )
            page.insert_text((50, 72), text, fontsize=12)
        else:
            text = (
                f"VEIL Architecture - Page {i}\n\n"
                f"This is background chapter {i}. It introduces high-level privacy principles "
                "and offline workspace guarantees without mentioning the specific retrieval latency."
            )
            page.insert_text((50, 72), text, fontsize=12)
    
    doc.save(filename)
    doc.close()
    print(f"Created multi-page PDF '{filename}' (7 pages) with key facts on Page 7.")

def upload_pdf(filename="test.pdf"):
    """Uploads a PDF to /api/files/upload via multipart/form-data."""
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    with open(filename, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/files/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))

def run_pipeline_test():
    print("==================================================")
    print("      VEIL CRITICAL PDF PIPELINE VERIFICATION     ")
    print("==================================================")

    # 1. Generate multi-page PDF
    print("\n[STEP 1] Generating genuine multi-page 'test.pdf'...")
    create_sample_pdf("test.pdf")

    # 2. Upload PDF
    print("\n[STEP 2] Uploading 'test.pdf' to /api/files/upload...")
    upload_res = upload_pdf("test.pdf")
    print("Upload response:", json.dumps(upload_res, indent=2))
    assert upload_res["status"] == "SUCCESS", "Upload status must be SUCCESS"
    uploaded_file = upload_res["files"][0]
    doc_id = uploaded_file["id"]
    print(f" -> File uploaded: {uploaded_file['filename']} (ID: {doc_id})")
    print(f" -> Pages: {uploaded_file.get('pages')}")
    print(f" -> Chunks: {uploaded_file.get('chunks')}")
    print(f" -> Characters: {uploaded_file.get('characters_extracted')}")
    print(f" -> Status: {uploaded_file.get('status')}")

    # 3. Verify Debug Document Endpoint (PART 20)
    print("\n[STEP 3] Verifying POST /api/debug/document...")
    debug_doc = post("/api/debug/document", {"filename": "test.pdf"})
    print("Debug Document info:", json.dumps(debug_doc, indent=2))
    assert debug_doc["pages"] == 7, f"Expected 7 pages, got {debug_doc['pages']}"
    assert debug_doc["chunks"] >= 7, f"Expected at least 7 chunks, got {debug_doc['chunks']}"
    assert debug_doc["indexed"] is True, "Expected document to be indexed"
    assert debug_doc["characters_extracted"] > 500, "Characters extracted should be > 500"
    print(" -> POST /api/debug/document VERIFIED!")

    # 4. Verify Debug Retrieval Endpoint (PART 20)
    print("\n[STEP 4] Verifying POST /api/debug/retrieval for page 7 content...")
    debug_ret = post("/api/debug/retrieval", {"query": "What does page 7 say about local retrieval?"})
    print("Debug Retrieval response:", json.dumps(debug_ret, indent=2))
    assert len(debug_ret["results"]) > 0, "Expected Moss to return retrieval matches"
    top_hit = debug_ret["results"][0]
    print(f" -> Top hit: file={top_hit['filename']}, page={top_hit['page']}, score={top_hit['score']}")
    assert top_hit["page"] == 7, f"Expected Page 7 to be top hit, got page {top_hit['page']}"
    assert "in-process" in top_hit["text"].lower() or "moss" in top_hit["text"].lower(), "Expected Page 7 text"
    assert debug_ret["latency_ms"] < 20.0, f"Moss latency should be sub-20ms, got {debug_ret['latency_ms']}ms"
    print(" -> POST /api/debug/retrieval VERIFIED!")

    # 5. Full Query with Local LLM (PART 21 - Steps 3 to 7)
    print("\n[STEP 5] Querying full pipeline: 'What does page 7 say about local retrieval?'")
    query_res = post("/api/query", {"question": "What does page 7 say about local retrieval?", "mode": "AUTO"})
    print("Query response routing:", query_res["routing"])
    print("Moss info:", query_res["moss"])
    print("Local AI info:", query_res["localAI"])
    print(f"Sources ({len(query_res['sources'])}):")
    for s in query_res["sources"]:
        print(f"  - {s.get('title')} | Page: {s.get('page')} | Score: {s.get('score')}")
    print(f"\nAI Generated Answer:\n{query_res['answer']}\n")

    assert query_res["routing"]["mode"] == "RETRIEVAL", f"Expected RETRIEVAL mode, got {query_res['routing']['mode']}"
    assert query_res["moss"]["used"] is True, "Moss must be used"
    assert query_res["moss"]["passages"] > 0, "Moss passages must be > 0"
    assert query_res["moss"]["latencyMs"] is not None, "Real Moss latency must be returned"
    assert query_res["localAI"]["latencyMs"] > 0, "Real Local AI latency must be returned"
    assert any(s.get("page") == 7 for s in query_res["sources"]), "Source must cite Page 7"
    assert any("test.pdf" in (s.get("title") or "").lower() for s in query_res["sources"]), "Source must cite test.pdf"
    
    # Check that answer actually synthesizes the retrieved text from Page 7
    ans_lower = query_res["answer"].lower()
    assert "page 7" in ans_lower or "local retrieval" in ans_lower or "moss" in ans_lower or "in-process" in ans_lower, \
        "Answer must be grounded in page 7 text!"
    print(" >>> STEP 5 (PDF RETRIEVAL + GEMINI) VERIFIED!")

    # 6. Test General AI without Moss (PART 22)
    print("\n[STEP 6] Testing General AI query (No Moss): 'What is React?'")
    gen1 = post("/api/query", {"question": "What is React?", "mode": "AUTO"})
    print("Gen1 Routing:", gen1["routing"]["mode"])
    print("Gen1 Moss used:", gen1["moss"]["used"])
    print("Gen1 AI Model:", gen1["localAI"]["model"], f"({gen1['localAI']['latencyMs']}ms)")
    print("Gen1 Answer excerpt:", gen1["answer"][:120], "...")
    assert gen1["routing"]["mode"] == "DIRECT"
    assert gen1["moss"]["used"] is False
    assert "react" in gen1["answer"].lower()
    print(" >>> STEP 6 (GENERAL AI: What is React?) VERIFIED!")

    print("\n[STEP 7] Testing General AI query 2: 'Explain recursion in Python.'")
    gen2 = post("/api/query", {"question": "Explain recursion in Python.", "mode": "AUTO"})
    print("Gen2 Routing:", gen2["routing"]["mode"])
    print("Gen2 Moss used:", gen2["moss"]["used"])
    print("Gen2 Answer excerpt:", gen2["answer"][:120], "...")
    assert gen2["routing"]["mode"] == "DIRECT"
    assert gen2["moss"]["used"] is False
    assert "recursion" in gen2["answer"].lower()
    print(" >>> STEP 7 (GENERAL AI: Recursion in Python) VERIFIED!")

    # 7. Scanned PDF Detection Test (PART 7)
    print("\n[STEP 8] Testing Scanned PDF Detection (PART 7)...")
    # Create empty image-only PDF
    scanned_doc = pymupdf.open()
    scanned_page = scanned_doc.new_page()
    # do not insert any text
    scanned_doc.save("scanned_sample.pdf")
    scanned_doc.close()
    
    scanned_upload = upload_pdf("scanned_sample.pdf")
    print("Scanned upload response:", json.dumps(scanned_upload, indent=2))
    scanned_file = scanned_upload["files"][0]
    assert scanned_file["status"] == "scanned" or "scanned" in scanned_file.get("processing_status", "").lower()
    assert "Scanned PDF detected — text extraction requires OCR." in scanned_file["processing_status"]
    print(" >>> STEP 8 (SCANNED PDF DETECTION) VERIFIED!")

    print("\n==================================================")
    print("   ALL PDF PIPELINE SPECIFICATIONS PASSED 100%!   ")
    print("==================================================")

if __name__ == "__main__":
    run_pipeline_test()
