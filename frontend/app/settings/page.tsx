"use client";

import { useState } from "react";
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
} from "lucide-react";

type SettingSection = "GENERAL" | "APPEARANCE" | "AI" | "PRIVACY" | "STORAGE" | "ABOUT";

export default function SettingsPage() {
  const [openSections, setOpenSections] = useState<Record<SettingSection, boolean>>({
    GENERAL: true,
    APPEARANCE: false,
    AI: false,
    PRIVACY: false,
    STORAGE: false,
    ABOUT: false,
  });

  const toggleSection = (section: SettingSection) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections: { id: SettingSection; title: string; icon: any }[] = [
    { id: "GENERAL", title: "GENERAL", icon: Sliders },
    { id: "APPEARANCE", title: "APPEARANCE", icon: Eye },
    { id: "AI", title: "AI INFERENCE", icon: Cpu },
    { id: "PRIVACY", title: "PRIVACY & AIR-GAP", icon: Shield },
    { id: "STORAGE", title: "STORAGE & MEMORY", icon: Database },
    { id: "ABOUT", title: "ABOUT VEIL", icon: Info },
  ];

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
          Manage runtime preferences, security thresholds, and storage.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
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

        {/* AI INFERENCE */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("AI")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F7FB]">
                AI INFERENCE
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
              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Primary AI Engine</p>
                  <p className="text-[11px] text-[#666660]">Google Gemini API for reasoning & generative intelligence</p>
                </div>
                <span className="text-xs font-mono text-[#32D583]">Gemini API</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Active Model</p>
                  <p className="text-[11px] text-[#666660]">Configured multimodal cloud reasoning model</p>
                </div>
                <span className="text-xs font-mono text-[#C9A45C]">gemini-1.5-flash</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Local Retrieval Layer</p>
                  <p className="text-[11px] text-[#666660]">MOSS Core native Rust in-memory search</p>
                </div>
                <span className="text-xs font-mono text-[#32D583]">MOSS Core (~5-10ms)</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Inference Temperature</p>
                  <p className="text-[11px] text-[#666660]">Lower values guarantee deterministic, factual answers</p>
                </div>
                <span className="text-xs font-mono text-[#F5F5F0]">0.2</span>
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
                PRIVACY & AIR-GAP
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
                  <p className="font-medium text-[#F5F5F0]">Telemetry & Network Calls</p>
                  <p className="text-[11px] text-[#666660]">All requests are kept in-process on device</p>
                </div>
                <span className="text-xs font-mono text-[#32D583]">DISABLED (100% AIR-GAPPED)</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Local Audit Trail</p>
                  <p className="text-[11px] text-[#666660]">Queries and retrievals logged only to private SQLite</p>
                </div>
                <span className="text-xs font-mono text-[#C9A45C]">ACTIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* STORAGE & MEMORY */}
        <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden transition-all">
          <button
            onClick={() => toggleSection("STORAGE")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F0]">
                STORAGE & MEMORY
              </span>
            </div>
            {openSections.STORAGE ? (
              <ChevronUp className="w-4 h-4 text-[#666660]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#666660]" />
            )}
          </button>

          {openSections.STORAGE && (
            <div className="p-5 pt-1 border-t border-[rgba(201,164,92,0.12)] space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(201,164,92,0.08)]">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Vector Index</p>
                  <p className="text-[11px] text-[#666660]">Moss In-Process Vector & Lexical Hybrid Memory</p>
                </div>
                <span className="text-xs font-mono text-[#F5F5F0]">veil-knowledge</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-[#F5F5F0]">Local SQLite Database</p>
                  <p className="text-[11px] text-[#666660]">File metadata, chunks, and audit logs</p>
                </div>
                <span className="text-xs font-mono text-[#A6A6A0]">veil.db</span>
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
                <span className="font-mono text-[#F5F5F0]">2.4.0 (Local First)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[rgba(201,164,92,0.08)]">
                <span className="text-[#666660]">Semantic Engine</span>
                <span className="font-mono text-[#C9A45C]">Moss SDK</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#666660]">Design System</span>
                <span className="font-mono text-[#A6A6A0]">Black + Warm Gold Identity</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
