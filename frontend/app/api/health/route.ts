import { NextResponse } from "next/server";
import { isGeminiConfigured, DEFAULT_GEMINI_MODEL } from "@/services/gemini";

export async function GET() {
  const configured = isGeminiConfigured();

  return NextResponse.json({
    status: "ok",
    service: "VEIL",
    version: "3.2.0",
    mode: "HYBRID_CLOUD_LOCAL",
    llm_provider: configured ? "GEMINI" : "OLLAMA_LOCAL",
    llm_model: configured ? DEFAULT_GEMINI_MODEL : "qwen2.5:0.5b",
    gemini_configured: configured,
    deployment: process.env.VERCEL ? "VERCEL_SERVERLESS" : "LOCAL_NODE",
    timestamp: Date.now(),
  });
}
