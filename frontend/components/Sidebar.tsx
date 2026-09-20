"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  MessageSquare,
  FileText,
  Activity,
  Cpu,
  Sparkles,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Compass },
    { label: "Workspace", href: "/workspace", icon: MessageSquare },
    { label: "Files", href: "/files", icon: FileText },
    { label: "Dashboard", href: "/dashboard", icon: Activity },
    { label: "Private AI", href: "/private", icon: Cpu },
    { label: "Analysis", href: "/analysis", icon: Sparkles },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-60 h-screen sticky top-0 bg-[#080808] border-r border-[#1A1A1A] select-none z-30 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#1A1A1A]">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Gold Cube SVG Icon */}
          <div className="w-8 h-8 rounded-lg bg-[#0D0D0D] border border-[rgba(201,164,92,0.18)] flex items-center justify-center group-hover:border-[#C9A45C]/50 transition-colors">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9A45C"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:scale-105 transition-transform"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-widest text-[#F5F5F0]">
              VEIL
            </span>
            <span className="text-[10px] tracking-wider text-[#666660] uppercase font-mono">
              LOCAL INTELLIGENCE
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#666660]">
            Workspace
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.30)] shadow-[0_0_12px_rgba(201,164,92,0.08)] font-semibold"
                  : "text-[#A6A6A0] hover:text-[#D8B46E] hover:bg-[#0D0D0D] border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-[#C9A45C]"
                    : "text-[#666660] group-hover:text-[#D8B46E]"
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A45C] shadow-[0_0_6px_#C9A45C]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Section: Settings & Status */}
      <div className="p-3 border-t border-[#1A1A1A] space-y-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
            pathname.startsWith("/settings")
              ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.30)]"
              : "text-[#A6A6A0] hover:text-[#D8B46E] hover:bg-[#0D0D0D] border border-transparent"
          }`}
        >
          <Settings
            className={`w-4 h-4 ${
              pathname.startsWith("/settings")
                ? "text-[#C9A45C]"
                : "text-[#666660] group-hover:text-[#D8B46E]"
            }`}
          />
          <span>Settings</span>
        </Link>

        {/* Local Security Status Badge */}
        <div className="px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32D583] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#32D583]"></span>
            </span>
            <span className="text-[11px] font-mono text-[#A6A6A0]">
              Offline Ready
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#666660]">
            Air-Gapped
          </span>
        </div>
      </div>
    </aside>
  );
}
