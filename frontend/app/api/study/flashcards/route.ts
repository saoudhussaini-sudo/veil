import { NextRequest, NextResponse } from "next/server";
import { generateGeminiJSON, isGeminiConfigured } from "@/services/gemini";

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  category: string;
  reference?: string;
}

export interface FlashcardsPayload {
  title: string;
  total: number;
  cards: Flashcard[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      count = 10,
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

    const cardCount = Math.min(Math.max(Number(count) || 10, 5), 30);

    const prompt = `DOCUMENT CONTENT:
\"\"\"
${content.slice(0, 45000)}
\"\"\"

TASK:
Generate an active-recall flashcard deck based strictly on the provided document content.
- Total cards: ${cardCount}
- FRONT: A clear, challenging question, prompt, or technical term.
- BACK: A concise, accurate answer, definition, or core explanation that a student can recite.
- CATEGORY: Topic or domain tag for this card.
- REFERENCE: Page or section citation if available.

Return the result as a single JSON object with EXACTLY this structure:
{
  "title": "${filename} Flashcards",
  "total": ${cardCount},
  "cards": [
    {
      "id": 1,
      "front": "Front question or concept?",
      "back": "Back answer or concise definition.",
      "category": "Core Concept",
      "reference": "Page 2"
    }
  ]
}`;

    const flashcards = await generateGeminiJSON<FlashcardsPayload>({
      prompt,
      personalization,
      temperature: 0.2,
    });

    return NextResponse.json({
      ...flashcards,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Flashcards API error:", err);
    return NextResponse.json(
      { error: "Failed to generate flashcards", detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
