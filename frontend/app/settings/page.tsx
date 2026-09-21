"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Cpu,
  Eye,
  Sliders,
  Database,
  Info,
  CheckCircle2,
  Trash2,
  Sparkles,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import {
  getPersonalizationSettings,
  savePersonalizationSettings,
  clearStudyCache,
  PersonalizationOptions,
} from "@/lib/api";

type SettingSection =
  | "PERSONALIZATION"
  | "AI"
  | "GENERAL"
  | "APPEARANCE"
  | "PRIVACY"
  | "STORAGE"
  | "ABOUT";

export default function SettingsPage() {
  const [openSections, setOpenSections] = useState<Record<SettingSection, boolean>>({
    PERSONALIZATION: true,
    AI: true,
    GENERAL: false,
    APPEARANCE: false,
    PRIVACY: false,
    STORAGE: false,
    ABOUT: false,
  });

  const [personalization, setPersonalization] = useState<PersonalizationOptions>({
    level: "intermediate",
    style: "simple",
    responseLength: "balanced",
  });

  const [activeProvider, setActiveProvider] = useState<"GEMINI" | "OLLAMA">("GEMINI");
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const p = getPersonalizationSettings();
    setPersonalization(p);
  }, []);

  const handleUpdatePersonalization = (updates: Partial<PersonalizationOptions>) => {
    const updated = { ...personalization, ...updates };
    setPersonalization(updated);
    savePersonalizationSettings(updated);
  };

  const toggleSection = (section: SettingSection) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleClearCache = () => {
    clearStudyCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="space-y-1 pb-6 border-b border-[rgba(201,164,92,0.12)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest text-[#C9A45C] uppercase">
            CONFIGURATION
          </span>
          <span className="text-[#666660]">/</span>
          <span className="text-[11px] font-mono tracking-widest text-[#A6A6A0] uppercase">
            SETTINGS
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
          Settings
        </h1>
        <p className="text-sm text-[#A6A6A0]">
          Manage learning preferences, AI provider routing, and security thresholds.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {/* PERSONALIZATION */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("PERSONALIZATION")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                STUDY & AI PERSONALIZATION
              </span>
            </div>
            {openSections.PERSONALIZATION ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.PERSONALIZATION && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-4 text-xs">
              {/* Learning Level */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Learning Level</p>
                  <p className="text-[11px] text-[#666660]">Tailors explanation depth and vocabulary</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleUpdatePersonalization({ level: lvl })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-all ${
                        personalization.level === lvl
                          ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.4)] font-semibold"
                          : "bg-[#090909] text-[#A6A6A0] border border-[#1A1A1A] hover:text-[#F5F5F0]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation Style */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Learning Style</p>
                  <p className="text-[11px] text-[#666660]">Pedagogical framing for all responses</p>
                </div>
                <select
                  value={personalization.style || "simple"}
                  onChange={(e) => handleUpdatePersonalization({ style: e.target.value as any })}
                  className="bg-[#090909] border border-[#1A1A1A] rounded-xl px-2.5 py-1.5 text-xs text-[#C9A45C] font-mono focus:outline-none"
                >
                  <option value="simple">Simple & Intuitive</option>
                  <option value="detailed">Detailed & Exhaustive</option>
                  <option value="exam-focused">Exam-Focused & High-Yield</option>
                  <option value="technical">Technical & Formula Rigorous</option>
                  <option value="examples-first">Examples & Analogies First</option>
                </select>
              </div>

              {/* Response Length */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Response Length</p>
                  <p className="text-[11px] text-[#666660]">Target brevity for generated summaries & answers</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(["short", "balanced", "detailed"] as const).map((len) => (
                    <button
                      key={len}
                      onClick={() => handleUpdatePersonalization({ responseLength: len })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-all ${
                        personalization.responseLength === len
                          ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.4)] font-semibold"
                          : "bg-[#090909] text-[#A6A6A0] border border-[#1A1A1A] hover:text-[#F5F5F0]"
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI INFERENCE & PROVIDER */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("AI")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                AI PROVIDER & INFERENCE
              </span>
            </div>
            {openSections.AI ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.AI && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-4 text-xs">
              {/* Active Provider Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Inference Engine</p>
                  <p className="text-[11px] text-[#666660]">Cloud serverless default with offline local fallback</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveProvider("GEMINI")}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-mono transition-all inline-flex items-center gap-1.5 ${
                      activeProvider === "GEMINI"
                        ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.4)] font-semibold"
                        : "bg-[#090909] text-[#A6A6A0] border border-[#1A1A1A]"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#C9A45C]" />
                    <span>Gemini Cloud (Default)</span>
                  </button>

                  <button
                    onClick={() => setActiveProvider("OLLAMA")}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-mono transition-all inline-flex items-center gap-1.5 ${
                      activeProvider === "OLLAMA"
                        ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.4)] font-semibold"
                        : "bg-[#090909] text-[#A6A6A0] border border-[#1A1A1A]"
                    }`}
                  >
                    <span>Ollama Local</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Production Model</p>
                  <p className="text-[11px] text-[#666660]">High-speed large context window reasoning</p>
                </div>
                <span className="text-xs font-mono text-[#C9A45C]">gemini-2.5-flash</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Anti-Hallucination Guardrail</p>
                  <p className="text-[11px] text-[#666660]">Explicitly rejects unsubstantiated assertions</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-mono text-[#32D583]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ENFORCED</span>
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">In-Memory Study Cache</p>
                  <p className="text-[11px] text-[#666660]">Prevents redundant API calls when switching study tabs</p>
                </div>
                <button
                  onClick={handleClearCache}
                  className="px-3 py-1 rounded-md bg-[#090909] hover:bg-[#111111] border border-[#1A1A1A] hover:border-[rgba(201,164,92,0.3)] text-[11px] font-mono text-[#A6A6A0] transition-all"
                >
                  {cacheCleared ? "Cleared!" : "Clear Cache"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GENERAL */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("GENERAL")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                GENERAL
              </span>
            </div>
            {openSections.GENERAL ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.GENERAL && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Default Query Mode</p>
                  <p className="text-[11px] text-[#666660]">Automatic routing between direct AI and retrieval</p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#090909] border border-[rgba(201,164,92,0.12)] text-[#C9A45C] font-mono">
                  AUTO
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Passages per Retrieval (Top-K)</p>
                  <p className="text-[11px] text-[#666660]">Maximum chunks injected into model context</p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#090909] border border-[rgba(201,164,92,0.12)] text-[#F5F5F0] font-mono">
                  4 passages
                </span>
              </div>
            </div>
          )}
        </div>

        {/* APPEARANCE */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("APPEARANCE")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                APPEARANCE
              </span>
            </div>
            {openSections.APPEARANCE ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.APPEARANCE && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Atmospheric Palette</p>
                  <p className="text-[11px] text-[#666660]">Refined Black + Warm Gold Aesthetic</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#050505] border border-[rgba(201,164,92,0.25)]" title="Void Black" />
                  <span className="w-4 h-4 rounded-full bg-[#C9A45C]" title="Primary Gold" />
                  <span className="w-4 h-4 rounded-full bg-[#D8B46E]" title="Bright Gold" />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Typography</p>
                  <p className="text-[11px] text-[#666660]">Inter modern variable sans-serif</p>
                </div>
                <span className="text-xs font-mono text-[#A6A6A0]">Inter</span>
              </div>
            </div>
          )}
        </div>

        {/* PRIVACY & AIR-GAP */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("PRIVACY")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                PRIVACY & SECURITY
              </span>
            </div>
            {openSections.PRIVACY ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.PRIVACY && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">API Key Protection</p>
                  <p className="text-[11px] text-[#666660]">Keys strictly accessed via serverless environment variables</p>
                </div>
                <span className="text-xs font-mono text-[#32D583]">ENCRYPTED SERVER-SIDE</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Client Isolation</p>
                  <p className="text-[11px] text-[#666660]">No sensitive credentials exposed to browser bundle</p>
                </div>
                <span className="text-xs font-mono text-[#C9A45C]">SECURED</span>
              </div>
            </div>
          )}
        </div>

        {/* ABOUT VEIL */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("ABOUT")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                ABOUT VEIL
              </span>
            </div>
            {openSections.ABOUT ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.ABOUT && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[rgba(201,164,92,0.08)]">
                <span className="text-[#666660]">Version</span>
                <span className="font-mono text-[#F5F5F0]">3.2.0 (Gemini Cloud + Local Hybrid)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[rgba(201,164,92,0.08)]">
                <span className="text-[#666660]">Cloud AI</span>
                <span className="font-mono text-[#C9A45C]">Google Gemini API</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[rgba(201,164,92,0.08)]">
                <span className="text-[#666660]">Local AI Fallback</span>
                <span className="font-mono text-[#A6A6A0]">Ollama (Qwen 2.5)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#666660]">Design System</span>
                <span className="font-mono text-[#A6A6A0]">Black + Champagne Gold (#C9A45C)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
