import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText, isGeminiConfigured } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tool,
      content,
      target = "",
      filename = "Document",
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
    switch (tool) {
      case "explain":
        instruction = `Deeply explain ${target ? `the following concept: "${target}"` : "the core topic"} from this document (${filename}).
Break it down logically with:
- Intuitive mental model
- Step-by-step breakdown
- Real-world context and significance`;
        break;

      case "simplify":
        instruction = `Explain ${target ? `"${target}"` : "the concepts in this document"} as simply as possible (ELI5 - Explain Like I'm 5).
Use everyday metaphors, clear analogies, zero confusing jargon, and straightforward relatable examples.`;
        break;

      case "rewrite":
        instruction = `Rewrite the notes/concepts from this document into impeccably organized, crystal-clear study notes.
Use crisp headings, clean bullet points, bold key terms, and logical visual structure.`;
        break;

      case "key_points":
        instruction = `Extract the absolute top high-impact KEY POINTS from this document (${filename}).
Highlight the most vital facts, rules, formulas, and takeaways that one must know.`;
        break;

      case "examples":
        instruction = `Generate 4-5 vivid REAL-WORLD EXAMPLES and practical analogies demonstrating ${target ? `"${target}"` : "the key concepts in this document"}.
Explain how each example mirrors the theoretical principle.`;
        break;

      case "compare":
        instruction = `Create a rigorous COMPARATIVE ANALYSIS of the key contrasting concepts found in this document (${filename}).
Format as:
1. Markdown Comparison Table (Criteria, Concept A, Concept B, Key Differences)
2. Subtle Distinctions & Common Points of Confusion`;
        break;

      case "ask_why":
        instruction = `Explore the fundamental "WHY" behind the concepts in this document (${filename}).
Answer:
- Why was this method/concept developed?
- Why does it work the way it does?
- What fundamental problem does it solve?
- What would happen if this principle didn't exist?`;
        break;

      case "exam_mode":
        instruction = `Activate EXAM CRUNCH MODE for this document (${filename}).
Provide:
1. High-Yield Must-Know Topics
2. Likely Examiner Tricks & Trap Questions
3. Critical Formulas / Definitions that must be memorized verbatim
4. Scoring Key Tips to get full marks on exam questions about this material`;
        break;

      case "notes_generator":
        instruction = `Generate comprehensive CORNELL-STYLE STUDY NOTES for this document (${filename}).
Format clearly with:
- **Cue Column / Key Questions** on the left or in bold
- **Notes Area**: Detailed structured explanations, equations, facts
- **Summary**: Concise bottom summary consolidating the entire topic`;
        break;

      case "revision_mode":
        instruction = `Generate a RAPID-FIRE 5-MINUTE REVISION SHEET for this document (${filename}).
Provide bite-sized, bulleted recall prompts, rapid facts, and micro-summaries designed to review 10 minutes before an exam.`;
        break;

      case "cheat_sheet":
      default:
        instruction = `Create a condensed 1-PAGE ULTIMATE CHEAT SHEET for this document (${filename}).
Condense all essential rules, formulas, core definitions, and pivotal concepts into a super-dense, high-density structured cheat sheet.`;
        break;
    }

    const prompt = `DOCUMENT CONTENT:
\"\"\"
${content.slice(0, 45000)}
\"\"\"

${target ? `SPECIFIC FOCUS / QUERY: ${target}\n` : ""}
TASK:
${instruction}

Provide your response in beautifully formatted markdown.`;

    const result = await generateGeminiText({
      prompt,
      personalization,
      temperature: 0.2,
    });

    return NextResponse.json({
      tool,
      result,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Tools API error:", err);
    return NextResponse.json(
      { error: "Failed to run study tool", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
