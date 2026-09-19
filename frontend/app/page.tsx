import Link from "next/link";
import { ArrowRight, Shield, Cpu, Network } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-12 sm:py-20 lg:py-28 relative overflow-hidden bg-[#050505]">
      {/* Subtle Gold Aura (cinematic, warm, understated) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[360px] bg-[#D4AF37]/[0.035] blur-[150px] pointer-events-none rounded-full" />

      {/* Main Hero Section */}
      <div className="max-w-4xl mx-auto w-full my-auto text-center space-y-8 z-10">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D0D0D] border border-[rgba(212,175,55,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
          <span className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
            CORE INNOVATION
          </span>
        </div>

        {/* Large Confident Heading */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#F5F5F0] leading-[1.05] font-sans">
          Your knowledge.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F0] via-[#F5F5F0] to-[#D4AF37]">
            Ask anything.
          </span>
        </h1>

        {/* Short Supporting Text */}
        <p className="text-base sm:text-xl text-[#A6A6A0] max-w-xl mx-auto font-light leading-relaxed">
          Private AI for your knowledge, files, and local intelligence.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/workspace"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#F0C75E] text-[#050505] font-semibold text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.22)] hover:shadow-[0_0_28px_rgba(212,175,55,0.32)] hover:scale-[1.02] active:scale-[0.99]"
          >
            <span>Enter Workspace</span>
            <ArrowRight className="w-4 h-4 text-[#050505]" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#222222] hover:border-[#D4AF37]/50 text-[#A6A6A0] hover:text-[#F5F5F0] font-medium text-sm transition-all"
          >
            <span>Explore VEIL</span>
          </Link>
        </div>
      </div>

      {/* Minimal 3-Pillar Feature Strip */}
      <div className="max-w-4xl mx-auto w-full pt-16 sm:pt-24 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-[#1A1A1A] text-left">
          {/* Pillar 1 */}
          <div className="space-y-1.5 group">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>PRIVATE</span>
            </div>
            <p className="text-sm text-[#A6A6A0]">Your data stays yours.</p>
          </div>

          {/* Pillar 2 */}
          <div className="space-y-1.5 group">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
              <Cpu className="w-3.5 h-3.5" />
              <span>LOCAL</span>
            </div>
            <p className="text-sm text-[#A6A6A0]">
              Run intelligence on your device.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="space-y-1.5 group">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
              <Network className="w-3.5 h-3.5" />
              <span>CONNECTED</span>
            </div>
            <p className="text-sm text-[#A6A6A0]">
              Ask across your knowledge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
