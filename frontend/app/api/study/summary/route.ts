import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText, isGeminiConfigured } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      type = "quick",
      filename = "document",
      personalization,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Document content is required." }, { status: 400 });
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

    let instruction = "";
    switch (type) {
      case "detailed":
        instruction = `Create a COMPREHENSIVE DETAILED SUMMARY of this document (${filename}).
Structure your response into:
1. Executive Summary & Core Objective
2. Deep Dive by Topic/Chapter (with subheadings and bullet points)
3. Key Methodologies / Arguments / Findings
4. Practical Implications & Takeaways
Make it thorough, well-formatted with markdown tables/lists where helpful.`;
        break;

      case "chapter":
        instruction = `Create a SECTION / CHAPTER BREAKDOWN for this document (${filename}).
For each section or major theme found in the text:
- **[Section / Chapter Name]**
  - Main concepts covered
  - Essential details and formulas/facts
  - Page references if available in context
Ensure complete coverage of the entire document from beginning to end.`;
        break;

      case "key_points":
        instruction = `Extract the CRITICAL KEY POINTS and High-Yield Takeaways from this document (${filename}).
Provide:
- Top 10-15 high-impact bullet points.
- Bold key terms.
- Focus on facts, definitions, essential rules, and exam-relevant findings.`;
        break;

      case "terms":
        instruction = `Extract an IMPORTANT TERMS GLOSSARY from this document (${filename}).
Format as a clean markdown glossary:
For each key technical term, concept, or formula:
- **Term**: Clear, student-friendly explanation and why it matters in context.
Include 10-25 crucial terms extracted directly from the document.`;
        break;

      case "tldr":
        instruction = `Create an ULTRA-COMPACT TL;DR (Too Long; Didn't Read) for this document (${filename}).
Requirements:
- Exactly 2 to 3 punchy sentences summarizing the entire core essence of the document.
- Followed by 3 quick bullet points of the single most important things to remember for an exam.`;
        break;

      case "quick":
      default:
        instruction = `Create a CLEAR QUICK SUMMARY of this document (${filename}).
Requirements:
- 1 concise overview paragraph explaining the primary subject and purpose.
- 5-7 core highlight bullet points.
- 1 concluding takeaway sentence.`;
        break;
    }

    const prompt = `DOCUMENT CONTENT:
\"\"\"
${content.slice(0, 50000)}
\"\"\"

TASK:
${instruction}`;

    const summary = await generateGeminiText({
      prompt,
      personalization,
      temperature: 0.2,
    });

    return NextResponse.json({
      type,
      filename,
      summary,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Summary API error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
