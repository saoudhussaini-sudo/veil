import { NextRequest, NextResponse } from "next/server";
import { generateGeminiJSON, isGeminiConfigured } from "@/services/gemini";

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  reference?: string;
}

export interface QuizPayload {
  title: string;
  difficulty: string;
  total: number;
  questions: QuizQuestion[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      difficulty = "medium",
      count = 5,
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

    const questionCount = Math.min(Math.max(Number(count) || 5, 3), 20);

    const prompt = `DOCUMENT CONTENT:
\"\"\"
${content.slice(0, 45000)}
\"\"\"

TASK:
Generate an interactive multiple-choice quiz based ONLY on the provided document content.
- Number of questions: ${questionCount}
- Target difficulty: ${difficulty.toUpperCase()} (Ensure the questions match this rigor accurately: easy = factual recall; medium = application & conceptual understanding; hard = nuanced analysis, edge cases & synthesis).
- Ground every single question strictly in the document content.
- Provide 4 plausible choices labeled A, B, C, D for each question.
- Specify the single correct answer letter (A, B, C, or D).
- Provide a clear, educational explanation explaining WHY that answer is correct based on the document.
- Cite the section or page number reference if available.

Return the result as a single JSON object with EXACTLY this structure:
{
  "title": "${filename} Quiz",
  "difficulty": "${difficulty}",
  "total": ${questionCount},
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A",
      "explanation": "Detailed explanation of the correct choice...",
      "reference": "Page / Section reference"
    }
  ]
}`;

    const quiz = await generateGeminiJSON<QuizPayload>({
      prompt,
      personalization,
      temperature: 0.2,
    });

    return NextResponse.json({
      ...quiz,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Quiz API error:", err);
    return NextResponse.json(
      { error: "Failed to generate quiz", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
