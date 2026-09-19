import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 text-center px-6 overflow-hidden">
      {/* Subtle cyan background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#22B8FF]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative max-w-4xl mx-auto flex flex-col items-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#080D12] border border-[#17232D] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22B8FF]" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#22B8FF] font-mono">
            PRIVACY-FIRST LOCAL AI ASSISTANT
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F5F9FC] leading-[1.08] mb-8 font-sans">
          Your data. <br />
          Your machine. <br />
          <span className="text-[#22B8FF]">Your intelligence.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl font-normal leading-relaxed mb-12">
          Search, compare, and understand your files with local AI and fast semantic retrieval.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold bg-[#22B8FF] text-[#000000] hover:bg-[#29C7FF] transition-all duration-200 shadow-lg shadow-[#22B8FF]/20 flex items-center justify-center gap-2"
          >
            <span>Ask VEIL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/files"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-medium bg-[#080D12] text-[#F5F9FC] border border-[#17232D] hover:border-[#22B8FF]/50 hover:bg-[#0E1620] transition-all duration-200"
          >
            Your Files
          </Link>
          <Link
            href="/activity"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-medium bg-[#080D12] text-[#94A3B8] border border-[#17232D] hover:text-[#F5F9FC] hover:border-[#22B8FF]/50 transition-all duration-200"
          >
            Offline Audit
          </Link>
        </div>
      </div>
    </section>
  );
}
