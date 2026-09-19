import urllib.request
import json

base = "http://localhost:3000"

def query(q, mode="auto"):
    payload = json.dumps({"question": q, "source": mode}).encode("utf-8")
    req = urllib.request.Request(f"{base}/api/query", data=payload, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8"))

def upload_file(filename, content):
    boundary = "VeilBoundary123"
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"files\"; filename=\"{filename}\"\r\n"
        f"Content-Type: text/plain\r\n\r\n"
        f"{content}\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")
    up_req = urllib.request.Request(
        f"{base}/api/files/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    return json.loads(urllib.request.urlopen(up_req).read().decode("utf-8"))

def run_tests():
    print("=== 1. TEST A: What is React.js? ===")
    resA = query("What is React.js?")
    print("Routing:", resA["routing"])
    print("Moss passages:", resA["moss"]["passages"])
    print("AI latency:", resA["ai"]["latencyMs"], "ms")
    print("Answer excerpt:\n", resA["answer"][:180])
    assert resA["routing"] == "WEB"
    assert resA["moss"]["passages"] > 0
    assert resA["ai"]["latencyMs"] > 0
    print("TEST A PASSED!\n")

    print("=== 2. TEST B: Upload test-document.md & query ===")
    doc_b = "VEIL_TEST:\nThe hidden project codename is Moonlight."
    upload_file("test-document.md", doc_b)
    resB = query("What is the hidden project codename in test-document.md?")
    print("Routing:", resB["routing"])
    print("Moss passages:", resB["moss"]["passages"])
    print("Top source:", resB["sources"][0]["title"])
    print("Answer excerpt:\n", resB["answer"][:180])
    assert "Moonlight" in resB["answer"] or "Moonlight" in resB["sources"][0]["snippet"]
    print("TEST B PASSED!\n")

    print("=== 3. TEST C: Upload A.txt and B.txt & contradiction ===")
    upload_file("A.txt", "Product A costs $100.")
    upload_file("B.txt", "Product A costs $120.")
    resC = query("Find the contradiction between these files.", mode="compare")
    print("Routing:", resC["routing"])
    print("Sources count:", len(resC["sources"]))
    print("Answer excerpt:\n", resC["answer"][:180])
    assert resC["routing"] == "COMPARISON"
    print("TEST C PASSED!\n")

    print("=== 4. TEST D: Fact-check query ===")
    resD = query("Is this still accurate according to current online information?", mode="fact_check")
    print("Routing:", resD["routing"])
    print("Moss searched files:", resD["moss"]["searchedFiles"], "| searched web:", resD["moss"]["searchedWeb"])
    assert resD["routing"] == "FACT_CHECK"
    print("TEST D PASSED!\n")

    print("=== 5. TEST E: Find the latest information about React ===")
    resE = query("Find the latest information about React.")
    print("Routing:", resE["routing"])
    print("Moss passages:", resE["moss"]["passages"])
    print("Answer excerpt:\n", resE["answer"][:180])
    assert resE["routing"] == "WEB"
    assert resE["moss"]["passages"] > 0
    assert "No relevant evidence" not in resE["answer"]
    print("TEST E PASSED!\n")

    print("==================================================")
    print("     ALL SECTION 14 TESTS PASSED COMPLETELY!      ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
