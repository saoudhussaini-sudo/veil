import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question = "Analyze the key insights, structure, and findings of this document.",
      content = "",
      documentContext = "",
      file_id = "",
      personalization,
    } = body;

    const docText = content || documentContext;
    if (!docText && !file_id) {
      return NextResponse.json({ error: "Document content or file_id is required." }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured.",
          detail: "Please set GEMINI_API_KEY in your environment variables.",
        },
        { status: 503 }
      );
    }

    const start = Date.now();
    const prompt = `DOCUMENT CONTENT:
\"\"\"
${docText.slice(0, 45000)}
\"\"\"

ANALYSIS PROMPT:
${question}

INSTRUCTIONS:
Conduct a rigorous, analytical breakdown of the document according to the user's prompt.
Organize findings with clear headings, core metrics, key takeaways, and conclusions.`;

    const analysis = await generateGeminiText({
      prompt,
      personalization,
      temperature: 0.2,
    });

    const latencyMs = Date.now() - start;

    return NextResponse.json({
      analysis,
      file_id,
      provider: "GEMINI",
      model: DEFAULT_GEMINI_MODEL,
      latencyMs,
    });
  } catch (err: any) {
    console.error("Analyze API error:", err);
    return NextResponse.json(
      { error: "Analysis failed", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
