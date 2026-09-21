import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      question,
      messages = [],
      documentContext = "",
      personalization,
    } = body;

    const query = (question || message || "").trim();
    if (!query && messages.length === 0) {
      return NextResponse.json({ error: "Missing query or messages." }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured.",
          detail: "Please set GEMINI_API_KEY in your Vercel Project Settings or .env.local file.",
        },
        { status: 503 }
      );
    }

    const startTime = Date.now();

    // Construct prompt with context if available
    let promptText = "";
    if (documentContext) {
      promptText = `DOCUMENT CONTEXT:
\"\"\"
${documentContext.slice(0, 40000)}
\"\"\"

USER QUESTION:
${query}

INSTRUCTIONS:
1. Answer the question using ONLY the provided document context.
2. If the answer is NOT present or cannot be clearly inferred from the document context, respond with:
"The requested information was not found in the uploaded document."
3. Cite specific pages or sections wherever possible (e.g. [Page X]).
4. Provide a clear, structured, well-formatted markdown response.`;
    } else {
      promptText = query;
    }

    const answer = await generateGeminiText({
      prompt: promptText,
      personalization,
      temperature: 0.2,
    });

    const latencyMs = Date.now() - startTime;

    // Detect sources if page markers are present in context
    const sources: Array<{ snippet: string; page?: number }> = [];
    if (documentContext) {
      const pageMatches: any[] = Array.from(documentContext.matchAll(/--- Page (\d+) ---/g));
      const pages = pageMatches.map((m) => parseInt(m[1], 10)).filter((p) => !isNaN(p));
      if (pages.length > 0) {
        sources.push({
          snippet: `Context referenced from pages: ${pages.slice(0, 5).join(", ")}${pages.length > 5 ? "..." : ""}`,
          page: pages[0],
        });
      }
    }

    return NextResponse.json({
      answer,
      sources,
      routing: { mode: documentContext ? "RETRIEVAL" : "DIRECT" },
      provider: "GEMINI",
      model: DEFAULT_GEMINI_MODEL,
      latencyMs,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        detail: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
