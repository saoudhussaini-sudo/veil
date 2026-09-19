"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Search,
  MessageSquare,
  FileText,
  TrendingUp,
  Settings
} from "lucide-react";
import SettingsModal from "./SettingsModal";

export default function Header() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isAskActive = pathname === "/" || pathname === "/ask";
  const isFilesActive = pathname === "/files";
  const isActivityActive = pathname === "/activity";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#17232D] bg-[#000000]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Hamburger + Cube Logo + Wordmark */}
          <div className="flex items-center gap-4">
            <button className="text-[#94A3B8] hover:text-[#F5F9FC] transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Cyan Geometric 3D Cube Icon */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22B8FF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-105 transition-transform"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>

              <span className="font-bold text-lg tracking-wider text-[#F5F9FC] font-sans">
                VEIL
              </span>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search your knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080D12] border border-[#17232D] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F9FC] placeholder-[#64748B] focus:outline-none focus:border-[#22B8FF]/60 transition-all"
              />
            </div>
          </div>

          {/* Right: Nav Tabs + Local Mode + User Avatar */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1.5">
              {/* Ask Tab */}
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isAskActive
                    ? "bg-[#0E2232] text-[#22B8FF] border border-[#22B8FF]/60 shadow-[0_0_10px_rgba(34,184,255,0.2)] font-semibold"
                    : "text-[#94A3B8] hover:text-[#F5F9FC] hover:bg-[#080D12]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#22B8FF]" />
                <span>Ask</span>
              </Link>

              {/* Files Tab */}
              <Link
                href="/files"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isFilesActive
                    ? "bg-[#0E2232] text-[#22B8FF] border border-[#22B8FF]/60 shadow-[0_0_10px_rgba(34,184,255,0.2)] font-semibold"
                    : "text-[#94A3B8] hover:text-[#F5F9FC] hover:bg-[#080D12]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Files</span>
              </Link>

              {/* Activity Tab */}
              <Link
                href="/activity"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActivityActive
                    ? "bg-[#0E2232] text-[#22B8FF] border border-[#22B8FF]/60 shadow-[0_0_10px_rgba(34,184,255,0.2)] font-semibold"
                    : "text-[#94A3B8] hover:text-[#F5F9FC] hover:bg-[#080D12]"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Activity</span>
              </Link>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F5F9FC] hover:bg-[#080D12] transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Local Mode Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#080D12] border border-[#17232D] text-xs font-mono text-[#F5F9FC]">
              <span className="w-2 h-2 rounded-full bg-[#32D583] shadow-[0_0_6px_rgba(50,213,131,0.6)]" />
              <span>Local Mode</span>
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#17232D] border border-[#273847] text-[#F5F9FC] flex items-center justify-center font-bold text-xs">
              S
            </div>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
