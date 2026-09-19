import React from "react";
import { Lock, Cpu, Database, EyeOff } from "lucide-react";

export default function PrivacySection() {
  return (
    <section id="privacy" className="py-20 px-6 bg-[#000000] border-t border-[#17232D]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#22B8FF] block mb-3 font-mono">
            TECHNICAL TRANSPARENCY
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F9FC] mb-4 font-sans">
            Your knowledge <span className="text-[#22B8FF]">stays close.</span>
          </h2>
          <p className="text-[#94A3B8] text-base max-w-2xl mx-auto leading-relaxed">
            VEIL retrieves relevant context using Moss rather than repeatedly sending
            your entire knowledge base to a remote AI system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-[#080D12] border border-[#17232D] hover:border-[#22B8FF]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center text-[#22B8FF] mb-5">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F9FC] mb-2 font-sans">
              In-Process Semantic Retrieval
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Once an index is loaded into the Moss runtime, semantic matching and
              hybrid BM25 queries execute directly inside the application process in 2ms to 8ms.
              Search queries do not make external database network hops on the hot path.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-[#080D12] border border-[#17232D] hover:border-[#22B8FF]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center text-[#22B8FF] mb-5">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F9FC] mb-2 font-sans">
              Strict Context Minimization
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Instead of passing megabytes of unread notes to a language model,
              VEIL passes only the top few matching paragraphs needed to answer your
              specific question. Unrelated private content is never exposed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-[#080D12] border border-[#17232D] hover:border-[#22B8FF]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center text-[#22B8FF] mb-5">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F9FC] mb-2 font-sans">
              Local Metadata Storage
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Document files, parsed chunks, and query history reside in a local
              SQLite database on your machine. No SaaS analytics, trackers, or telemetry
              monitor your reading habits.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-2xl bg-[#080D12] border border-[#17232D] hover:border-[#22B8FF]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center text-[#22B8FF] mb-5">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F9FC] mb-2 font-sans">
              Decoupled Inference Layer
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              You choose the inference model: Ollama, local instruct models, or offline
              synthesizers. Everything runs locally on device with real audit trails.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
