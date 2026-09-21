import { NextRequest, NextResponse } from "next/server";
import { generateGeminiJSON, isGeminiConfigured } from "@/services/gemini";

export interface QAItem {
  id: number;
  question: string;
  answer: string;
  category: "Short Answer" | "Long Answer" | "Important Questions" | "Exam Questions" | "Conceptual Questions";
  difficulty: "Easy" | "Medium" | "Hard";
  reference?: string;
  keyPoints?: string[];
}

export interface QAPayload {
  title: string;
  category: string;
  total: number;
  items: QAItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      category = "all",
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

    let categoryInstruction = "";
    if (category === "short") {
      categoryInstruction = "Generate 8-10 Short Answer Questions with concise, high-impact 2-4 sentence model answers.";
    } else if (category === "long") {
      categoryInstruction = "Generate 4-6 Long Answer / Essay Questions with comprehensive structured answers (introduction, key mechanisms/arguments, and conclusion).";
    } else if (category === "important") {
      categoryInstruction = "Generate 8-10 High-Yield Important Questions that professors or examiners are most likely to test.";
    } else if (category === "conceptual") {
      categoryInstruction = "Generate 6-8 Deep Conceptual Questions testing underlying 'why' and 'how' principles.";
    } else {
      categoryInstruction = "Generate a balanced suite of 10 Exam Q&As across all categories (Short Answer, Long Answer, Conceptual, and High-Yield Important Questions).";
    }

    const prompt = `DOCUMENT CONTENT:
\"\"\"
${content.slice(0, 45000)}
\"\"\"

TASK:
${categoryInstruction}
Ground every question and answer strictly in the document content. Include references (e.g. Page number or section name) whenever identifiable in context.

Return the result as a single JSON object with EXACTLY this structure:
{
  "title": "${filename} Exam Q&A",
  "category": "${category}",
  "total": 10,
  "items": [
    {
      "id": 1,
      "question": "Question text here?",
      "answer": "Detailed model answer text...",
      "category": "Short Answer",
      "difficulty": "Medium",
      "reference": "Page / Section reference",
      "keyPoints": ["Bullet 1", "Bullet 2"]
    }
  ]
}`;

    const qaData = await generateGeminiJSON<QAPayload>({
      prompt,
      personalization,
      temperature: 0.2,
    });

    return NextResponse.json({
      ...qaData,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("QA API error:", err);
    return NextResponse.json(
      { error: "Failed to generate Q&A", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
