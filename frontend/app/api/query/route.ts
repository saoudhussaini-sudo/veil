import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      context = "",
      documentContext = "",
      personalization,
    } = body;

    const query = (question || "").trim();
    if (!query) {
      return NextResponse.json({ error: "Query question is required." }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured.",
          detail: "Please configure GEMINI_API_KEY in your environment to run AI queries.",
        },
        { status: 503 }
      );
    }

    const start = Date.now();
    const activeContext = documentContext || context;

    let prompt = "";
    if (activeContext) {
      prompt = `DOCUMENT CONTEXT:
\"\"\"
${activeContext.slice(0, 45000)}
\"\"\"

QUESTION:
${query}

INSTRUCTIONS:
1. Answer the question using ONLY the provided document context.
2. If the information is NOT present or cannot be inferred from the document, respond:
"The requested information was not found in the uploaded document."
3. Cite page numbers or sections whenever mentioned in the text.`;
    } else {
      prompt = query;
    }

    const answer = await generateGeminiText({
      prompt,
      personalization,
      temperature: 0.2,
    });

    const latencyMs = Date.now() - start;

    return NextResponse.json({
      answer,
      routing: { mode: activeContext ? "RETRIEVAL" : "DIRECT" },
      sources: activeContext
        ? [{ title: "Active Document", score: 0.95, snippet: activeContext.slice(0, 200) }]
        : [],
      moss: { used: false, passages: 0 },
      localAI: {
        used: true,
        provider: "GEMINI",
        model: DEFAULT_GEMINI_MODEL,
        latencyMs,
      },
      accessedFiles: [],
    });
  } catch (err: any) {
    console.error("Query API error:", err);
    return NextResponse.json(
      { error: "Query execution failed", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
