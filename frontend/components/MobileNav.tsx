"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Compass,
  MessageSquare,
  FileText,
  Activity,
  Cpu,
  Sparkles,
  Settings,
} from "lucide-react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navItems = [
    { label: "Home", href: "/", icon: Compass },
    { label: "Workspace", href: "/workspace", icon: MessageSquare },
    { label: "Files", href: "/files", icon: FileText },
    { label: "Dashboard", href: "/dashboard", icon: Activity },
    { label: "Private AI", href: "/private", icon: Cpu },
    { label: "Analysis", href: "/analysis", icon: Sparkles },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 w-full bg-[#080808]/95 backdrop-blur-md border-b border-[#1A1A1A]">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0D0D0D] border border-[rgba(201,164,92,0.18)] flex items-center justify-center">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9A45C"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-widest text-[#F5F5F0]">
            VEIL
          </span>
        </Link>

        {/* Right: Status dot + Hamburger button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#32D583]" />
            <span className="text-[10px] font-mono text-[#A6A6A0]">Local</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Navigation Menu"
            className="w-10 h-10 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-center text-[#A6A6A0] hover:text-[#D8B46E] transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 transition-opacity"
        >
          {/* Drawer Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-0 right-0 w-4/5 max-w-xs h-full bg-[#080808] border-l border-[#1A1A1A] flex flex-col z-50 animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-widest text-[#F5F5F0]">
                  VEIL
                </span>
                <span className="text-[10px] font-mono text-[#666660]">
                  v2.4
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A6A6A0] hover:text-[#F5F5F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
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
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.30)] shadow-[0_0_12px_rgba(201,164,92,0.08)] font-semibold"
                        : "text-[#A6A6A0] hover:text-[#D8B46E] hover:bg-[#0D0D0D]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#C9A45C]" : "text-[#666660]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#1A1A1A] space-y-3">
              <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#A6A6A0]">Local Intelligence</span>
                  <span className="text-[#32D583] font-mono font-medium">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-[#666660]">
                  Moss retrieval & on-device Ollama.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
