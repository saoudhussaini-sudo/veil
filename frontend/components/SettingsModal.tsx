"use client";

import { useState, useEffect } from "react";
import { X, Settings, Cpu, Database, Check, Loader2 } from "lucide-react";
import { fetchHealth } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState("ollama");
  const [model, setModel] = useState("qwen2.5:0.5b");
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:11434");
  const [mossProjectId, setMossProjectId] = useState("");
  const [mossProjectKey, setMossProjectKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHealth()
        .then((data) => {
          if (data.local_ai) {
            setProvider(data.local_ai.provider || "ollama");
            setModel(data.local_ai.model || "qwen2.5:0.5b");
            setBaseUrl(data.local_ai.base_url || "http://127.0.0.1:11434");
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          base_url: baseUrl,
          moss_project_id: mossProjectId,
          moss_project_key: mossProjectKey,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setMessage("Settings updated successfully.");
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-[#080D12] border border-[#17232D] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#17232D] flex items-center justify-between bg-[#05080C]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#22B8FF]" />
            <h3 className="text-sm font-semibold text-[#F5F9FC] font-sans">
              Local AI & Moss Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F5F9FC] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono ${
                message.includes("Error")
                  ? "bg-[#251010] border-[#FF5555]/40 text-[#FF8888]"
                  : "bg-[#0A2016] border-[#32D583]/40 text-[#32D583]"
              }`}
            >
              {message}
            </div>
          )}

          {/* Section 1: Local AI Runtime */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
              <Cpu className="w-3.5 h-3.5 text-[#22B8FF]" />
              <span>Local AI Engine</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-mono">
                  Runtime Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#05080C] border border-[#17232D] text-[#F5F9FC] focus:outline-none focus:border-[#22B8FF]"
                >
                  <option value="ollama">Ollama (Default)</option>
                  <option value="local-offline-engine">Offline Local Engine</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-mono">
                  Configured Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen2.5:0.5b, llama3..."
                  className="w-full px-3 py-2 rounded-xl bg-[#05080C] border border-[#17232D] text-[#F5F9FC] font-mono focus:outline-none focus:border-[#22B8FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#64748B] mb-1 font-mono">
                Local AI Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="w-full px-3 py-2 rounded-xl bg-[#05080C] border border-[#17232D] text-[#F5F9FC] font-mono focus:outline-none focus:border-[#22B8FF]"
              />
            </div>
          </div>

          {/* Section 2: Moss Retrieval */}
          <div className="space-y-3 pt-3 border-t border-[#17232D]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider font-mono">
              <Database className="w-3.5 h-3.5 text-[#22B8FF]" />
              <span>Moss Retrieval Layer</span>
            </div>

            <div>
              <label className="block text-[11px] text-[#64748B] mb-1 font-mono">
                Index Name
              </label>
              <input
                type="text"
                disabled
                value="veil-knowledge"
                className="w-full px-3 py-2 rounded-xl bg-[#05080C] border border-[#17232D] text-[#64748B] font-mono cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-mono">
                  Moss Project ID (Optional)
                </label>
                <input
                  type="text"
                  value={mossProjectId}
                  onChange={(e) => setMossProjectId(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-xl bg-[#05080C] border border-[#17232D] text-[#F5F9FC] font-mono focus:outline-none focus:border-[#22B8FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#64748B] mb-1 font-mono">
                  Moss Project Key (Optional)
                </label>
                <input
                  type="password"
                  value={mossProjectKey}
                  onChange={(e) => setMossProjectKey(e.target.value)}
                  placeholder="Keep server-side"
                  className="w-full px-3 py-2 rounded-xl bg-[#05080C] border border-[#17232D] text-[#F5F9FC] font-mono focus:outline-none focus:border-[#22B8FF]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#17232D] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F5F9FC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#22B8FF] hover:bg-[#29C7FF] text-[#000000] font-semibold text-xs transition-all shadow-[0_0_12px_rgba(34,184,255,0.25)] flex items-center gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
