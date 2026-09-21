import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Ensure GEMINI_API_KEY is only accessed server-side
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  return apiKey.trim();
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey().length > 0;
}

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
export const FALLBACK_GEMINI_MODEL = "gemini-flash-lite-latest";

export interface PersonalizationOptions {
  level?: "beginner" | "intermediate" | "advanced";
  style?: "simple" | "detailed" | "exam-focused" | "technical" | "examples-first";
  responseLength?: "short" | "balanced" | "detailed";
}

export const ANTI_HALLUCINATION_SYSTEM_PROMPT = `You are VEIL, a precision AI Document & Study Assistant.

CORE RULES:
1. Ground your answers strictly in the provided document context whenever document text is supplied.
2. If the user asks a question about the document and the answer is NOT present or supported by the uploaded document, you MUST explicitly state:
"The requested information was not found in the uploaded document."
3. Do NOT fabricate, assume, or hallucinate facts that are absent from the document.
4. When citing information from the document, cite the specific page or section whenever possible (e.g. [Page 3]).
5. Maintain a professional, clear, and student-friendly tone. Format with clear headings, bullet points, and code/math blocks when appropriate.`;

export function buildPersonalizationPrompt(options?: PersonalizationOptions): string {
  if (!options) return "";
  const parts: string[] = [];

  if (options.level) {
    if (options.level === "beginner") {
      parts.push("Target audience: Beginner. Use plain language, clear analogies, and avoid unnecessary jargon.");
    } else if (options.level === "advanced") {
      parts.push("Target audience: Advanced. Provide in-depth technical rigor, nuanced distinctions, and comprehensive terminology.");
    } else {
      parts.push("Target audience: Intermediate. Balance clarity with technical accuracy.");
    }
  }

  if (options.style) {
    switch (options.style) {
      case "simple":
        parts.push("Explanation style: Simple, intuitive, and easy to grasp immediately.");
        break;
      case "detailed":
        parts.push("Explanation style: Thorough and exhaustive with comprehensive breakdowns.");
        break;
      case "exam-focused":
        parts.push("Explanation style: Exam-focused. Highlight high-yield points, key definitions, and common pitfalls.");
        break;
      case "technical":
        parts.push("Explanation style: Technical and precise, focusing on mechanics, specifications, and formulas.");
        break;
      case "examples-first":
        parts.push("Explanation style: Concrete examples and case illustrations before abstract theory.");
        break;
    }
  }

  if (options.responseLength) {
    if (options.responseLength === "short") {
      parts.push("Length: Concise and to the point. No fluff.");
    } else if (options.responseLength === "detailed") {
      parts.push("Length: Comprehensive and detailed.");
    } else {
      parts.push("Length: Balanced length.");
    }
  }

  return parts.length > 0 ? `\n\nUSER PREFERENCES:\n${parts.join("\n")}` : "";
}

/**
 * Execute Gemini model with retry on rate limit (429) or transient errors
 */
async function callWithRetry<T>(fn: (modelName: string) => Promise<T>): Promise<T> {
  const models = [DEFAULT_GEMINI_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.6-flash", "gemini-pro-latest"];
  let lastError: any = null;

  for (const modelName of models) {
    let retries = 2;
    let delay = 1000;

    while (retries >= 0) {
      try {
        return await fn(modelName);
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const status = err?.status || err?.statusCode;

        // If rate limited, overloaded, or service unavailable, backoff and retry or try fallback model
        if (
          status === 429 ||
          status === 503 ||
          msg.includes("429") ||
          msg.includes("503") ||
          msg.includes("Quota") ||
          msg.includes("ResourceExhausted") ||
          msg.includes("high demand") ||
          msg.includes("Service Unavailable") ||
          msg.includes("Overloaded")
        ) {
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
            retries--;
            continue;
          }
          // Break inner loop to try next fallback model
          break;
        }

        // If model not found or deprecated, try next model immediately
        if (status === 404 || msg.includes("not found") || msg.includes("is not supported")) {
          break;
        }

        // For other fatal errors, throw immediately
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini API.");
}

/**
 * Generate standard text using Google Gemini
 */
export async function generateGeminiText(params: {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  personalization?: PersonalizationOptions;
}): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const sysPrompt = (params.systemInstruction || ANTI_HALLUCINATION_SYSTEM_PROMPT) +
    buildPersonalizationPrompt(params.personalization);

  return callWithRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: sysPrompt,
      generationConfig: {
        temperature: params.temperature ?? 0.2,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const result = await model.generateContent(params.prompt);
    const response = await result.response;
    return response.text().trim();
  });
}

/**
 * Generate guaranteed structured JSON output from Google Gemini
 */
export async function generateGeminiJSON<T>(params: {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  personalization?: PersonalizationOptions;
}): Promise<T> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const sysPrompt = (params.systemInstruction || ANTI_HALLUCINATION_SYSTEM_PROMPT) +
    buildPersonalizationPrompt(params.personalization) +
    "\n\nCRITICAL: You MUST respond ONLY with valid, raw JSON. Do not include markdown codeblocks (```json or ```) or any preamble or explanation.";

  return callWithRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: sysPrompt,
      generationConfig: {
        temperature: params.temperature ?? 0.1,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(params.prompt);
    const response = await result.response;
    const raw = response.text().trim();

    // Clean any markdown formatting if present
    const cleanJson = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleanJson) as T;
    } catch (e: any) {
      // If parsing fails, try finding the first { or [ and last } or ]
      const startIdx = Math.min(
        cleanJson.indexOf("{") === -1 ? Infinity : cleanJson.indexOf("{"),
        cleanJson.indexOf("[") === -1 ? Infinity : cleanJson.indexOf("[")
      );
      const endIdx = Math.max(cleanJson.lastIndexOf("}"), cleanJson.lastIndexOf("]"));

      if (startIdx !== Infinity && endIdx > startIdx) {
        const sliced = cleanJson.substring(startIdx, endIdx + 1);
        return JSON.parse(sliced) as T;
      }
      throw new Error(`Failed to parse structured JSON from Gemini response: ${e.message}\nRaw: ${raw.slice(0, 200)}...`);
    }
  });
}
