"use client";

import React from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F0] flex flex-col md:flex-row antialiased selection:bg-[#D4AF37]/25 selection:text-white">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Mobile Top Nav Bar */}
      <MobileNav />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
