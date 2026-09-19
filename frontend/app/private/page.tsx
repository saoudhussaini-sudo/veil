"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  Shield,
  Zap,
  HardDrive,
  WifiOff,
  CheckCircle2,
  Loader2,
  Play,
} from "lucide-react";
import {
  fetchAiModels,
  selectAiModel,
  testAiGeneration,
} from "@/lib/api";

export default function PrivateAIPage() {
  const [activeModel, setActiveModel] = useState("qwen2.5:0.5b");
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(true);
  const [testPrompt, setTestPrompt] = useState("Explain the concept of entropy in one sentence.");
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await fetchAiModels();
      setActiveModel(data.active_model || "qwen2.5:0.5b");
      setModels(data.models || ["qwen2.5:0.5b"]);
    } catch (err) {
      console.error("Failed to load models:", err);
      setModels(["qwen2.5:0.5b"]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleSelectModel = async (model: string) => {
    if (model === activeModel || switching) return;
    setSwitching(model);
    try {
      await selectAiModel(model);
      setActiveModel(model);
    } catch (err: any) {
      alert("Error switching model: " + err.message);
    } finally {
      setSwitching(null);
    }
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim() || testLoading) return;
    setTestLoading(true);
    setTestResponse(null);
    try {
      const res = await testAiGeneration(testPrompt);
      setTestResponse(res);
    } catch (err: any) {
      alert("Test generation error: " + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Header */}
      <div className="space-y-1 pb-6 border-b border-[rgba(212,175,55,0.12)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest text-[#D4AF37] uppercase">
            PRIVATE INTELLIGENCE
          </span>
          <span className="text-[#666660]">/</span>
          <span className="text-[11px] font-mono tracking-widest text-[#A6A6A0] uppercase">
            ON-DEVICE AI
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
          Your AI runs on your device.
        </h1>
        <p className="text-sm text-[#A6A6A0]">
          Zero external API dependencies. Complete data sovereignty.
        </p>
      </div>

      {/* 4 Status Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[rgba(212,175,55,0.12)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666660]">
            MODEL
          </span>
          <p className="text-sm font-semibold text-[#F5F5F0] truncate">
            {activeModel.split(":")[0] || "Qwen 2.5"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[rgba(212,175,55,0.12)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666660]">
            STATUS
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#32D583]" />
            <p className="text-sm font-semibold text-[#32D583]">
              Running locally
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[rgba(212,175,55,0.12)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666660]">
            PROCESSING
          </span>
          <p className="text-sm font-semibold text-[#F5F5F0]">
            On-device
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[rgba(212,175,55,0.12)] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666660]">
            NETWORK
          </span>
          <p className="text-sm font-semibold text-[#A6A6A0]">
            Offline capable
          </p>
        </div>
      </div>

      {/* Reassurance Banner */}
      <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-[rgba(212,175,55,0.12)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#F5F5F0]">
              Everything processed here can remain on your device.
            </h3>
            <p className="text-xs text-[#A6A6A0]">
              No prompts, documents, or reasoning logs are ever transmitted over the network.
            </p>
          </div>

          {/* Simple Toggle: LOCAL ONLY ON */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono tracking-wider uppercase text-[#A6A6A0]">
              LOCAL ONLY
            </span>
            <button
              onClick={() => setLocalOnly(!localOnly)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 border ${
                localOnly
                  ? "bg-[#111111] border-[rgba(212,175,55,0.40)]"
                  : "bg-[#0D0D0D] border-[rgba(212,175,55,0.12)]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  localOnly ? "translate-x-6 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "translate-x-0 bg-[#666660]"
                }`}
              />
            </button>
            <span className="text-xs font-mono font-bold text-[#D4AF37]">
              {localOnly ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      {/* Simple Model Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-[#666660]">
            CONFIGURED LOCAL MODELS
          </span>
          <span className="text-[10px] font-mono text-[#666660]">
            Ollama Instance
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs font-mono text-[#666660] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
            <span>Scanning local models...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {models.map((model) => {
              const isCurrent = model === activeModel;
              const isSwitchingThis = switching === model;

              return (
                <div
                  key={model}
                  onClick={() => handleSelectModel(model)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[#111111] border-[rgba(212,175,55,0.40)] shadow-[0_0_16px_rgba(212,175,55,0.08)]"
                      : "bg-[#0D0D0D] border-[rgba(212,175,55,0.12)] hover:border-[rgba(212,175,55,0.30)] hover:bg-[#111111]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Cpu
                      className={`w-4 h-4 ${
                        isCurrent ? "text-[#D4AF37]" : "text-[#666660]"
                      }`}
                    />
                    {isSwitchingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                    ) : isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#32D583]" />
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold text-[#F5F5F0] font-mono">
                    {model}
                  </p>
                  <p className="text-[11px] text-[#666660] mt-1">
                    {isCurrent ? "Active model" : "Click to select"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Latency & Generation Tester */}
      <div className="pt-4 border-t border-[rgba(212,175,55,0.12)] space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[#666660]">
          TEST ON-DEVICE INFERENCE
        </span>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[rgba(212,175,55,0.12)] space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt..."
              className="flex-1 bg-[#090909] border border-[rgba(255,255,255,0.08)] focus:border-[#D4AF37] rounded-xl px-3.5 py-2 text-xs text-[#F5F5F0] placeholder-[#666660] focus:outline-none transition-colors"
            />
            <button
              onClick={handleRunTest}
              disabled={testLoading || !testPrompt.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#F0C75E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40 shrink-0"
            >
              {testLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050505]" />
              ) : (
                <Play className="w-3 h-3 fill-current text-[#050505]" />
              )}
              <span>Run Test</span>
            </button>
          </div>

          {testResponse && (
            <div className="p-3.5 rounded-xl bg-[#090909] border border-[rgba(212,175,55,0.12)] space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#666660]">
                <span>MODEL: {testResponse.model}</span>
                <span className="text-[#D4AF37]">
                  LATENCY: {testResponse.latency_ms?.toFixed(1)}ms
                </span>
              </div>
              <p className="text-xs text-[#F5F5F0] leading-relaxed">
                {testResponse.response}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
