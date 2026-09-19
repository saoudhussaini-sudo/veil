import React from "react";
import { FileText, Zap, Cpu } from "lucide-react";

export default function FeatureCards() {
  const features = [
    {
      icon: <FileText className="w-5 h-5 text-[#22B8FF]" />,
      title: "Your Files",
      description:
        "Bring your documents, research papers, notes, and code into one private workspace.",
      tags: ["Multiple Formats", "Private by Default"],
    },
    {
      icon: <Zap className="w-5 h-5 text-[#22B8FF]" />,
      title: "Moss Retrieval",
      description:
        "Find the most relevant information in milliseconds with local semantic search.",
      tags: ["Sub-10ms", "On-Device"],
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#22B8FF]" />,
      title: "Offline Intelligence",
      description:
        "Let your local model reason, create, and analyze with full privacy.",
      tags: ["General Q&A", "Code & Analysis"],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {features.map((feat, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-[#080D12] border border-[#17232D] p-6 flex flex-col justify-between hover:border-[#22B8FF]/40 transition-all group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              {feat.icon}
            </div>
            <h3 className="text-base font-semibold text-[#F5F9FC] mb-2 font-sans">
              {feat.title}
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
              {feat.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {feat.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="px-2.5 py-1 rounded-lg bg-[#0A1722] border border-[#163044] text-[11px] font-medium text-[#22B8FF]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
