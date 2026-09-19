"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  Search,
  Cpu,
  BarChart3,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Database,
  ChevronDown
} from "lucide-react";
import { fetchAnalytics, AnalyticsSummary } from "@/lib/api";

export default function ActivityDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetchAnalytics()
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching local analytics:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "RETRIEVED":
        return "text-[#22B8FF] bg-[#0E2232] border-[#16394F]";
      case "ANALYZED":
        return "text-[#32D583] bg-[#0F2D1F] border-[#16442E]";
      case "COMPARED":
        return "text-[#29C7FF] bg-[#0E2232] border-[#16394F]";
      case "VIEWED":
        return "text-[#94A3B8] bg-[#0E1620] border-[#17232D]";
      case "INDEXED":
        return "text-[#64748B] bg-[#080D12] border-[#17232D]";
      default:
        return "text-[#94A3B8] bg-[#0E1620] border-[#17232D]";
    }
  };

  // Calculate max count for simple CSS bar chart
  const maxCount = Math.max(...(summary?.access_over_time?.map((d) => d.count) || [1]), 1);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-mono tracking-widest uppercase text-[#22B8FF]">
          <ShieldCheck className="w-4 h-4 text-[#32D583]" />
          <span>LOCAL AUDIT TRAIL</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5F9FC] font-sans">
          Data accessed offline.
        </h1>
        <p className="text-sm md:text-base text-[#94A3B8] mt-1">
          See what your local assistant has actually used with complete on-device privacy.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Files Accessed */}
        <div className="p-5 rounded-2xl bg-[#080D12] border border-[#17232D] relative overflow-hidden">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B] block mb-2 font-mono">
            FILES ACCESSED
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[#F5F9FC] font-sans">
            {summary?.files_accessed ?? 0}
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">distinct documents used</p>
        </div>

        {/* Offline Queries */}
        <div className="p-5 rounded-2xl bg-[#080D12] border border-[#17232D] relative overflow-hidden">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B] block mb-2 font-mono">
            OFFLINE QUERIES
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[#22B8FF] font-sans">
            {summary?.offline_queries ?? 0}
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">executed on this device</p>
        </div>

        {/* Moss Retrievals */}
        <div className="p-5 rounded-2xl bg-[#080D12] border border-[#17232D] relative overflow-hidden">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B] block mb-2 font-mono">
            MOSS RETRIEVALS
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[#F5F9FC] font-sans">
            {summary?.moss_retrievals ?? 0}
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">fast semantic lookups</p>
        </div>

        {/* Local Analyses */}
        <div className="p-5 rounded-2xl bg-[#080D12] border border-[#17232D] relative overflow-hidden">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B] block mb-2 font-mono">
            LOCAL ANALYSES
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[#F5F9FC] font-sans">
            {summary?.local_analyses ?? 0}
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">structured & comparisons</p>
        </div>
      </div>

      {/* Access Over Time Chart */}
      <div className="p-6 rounded-2xl bg-[#080D12] border border-[#17232D]">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#17232D]">
          <div>
            <h2 className="text-base font-semibold text-[#F5F9FC] font-sans">
              Access over time
            </h2>
            <p className="text-xs text-[#64748B]">
              Daily frequency of offline file interactions
            </p>
          </div>
          <span className="text-xs font-mono text-[#22B8FF] px-2.5 py-1 rounded-lg bg-[#0E2232] border border-[#16394F]">
            PAST 7 DAYS
          </span>
        </div>

        {/* CSS Bar Chart */}
        <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
          {summary?.access_over_time?.map((item, idx) => {
            const heightPercent = Math.max((item.count / maxCount) * 100, 8);
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-[#64748B] group-hover:text-[#22B8FF] transition-colors">
                  {item.count}
                </span>
                <div className="w-full max-w-[40px] bg-[#05080C] rounded-t-lg relative overflow-hidden h-full flex items-end border border-[#17232D]">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-[#17232D] group-hover:bg-[#22B8FF] transition-all rounded-t-lg shadow-[0_0_8px_rgba(34,184,255,0.3)]"
                  />
                </div>
                <span className="text-xs font-mono text-[#94A3B8]">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Recent Access & Most Accessed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT ACCESS */}
        <div className="p-6 rounded-2xl bg-[#080D12] border border-[#17232D]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#17232D]">
            <h2 className="text-base font-semibold text-[#F5F9FC] font-sans">
              Recent Access
            </h2>
            <span className="text-xs font-mono text-[#64748B]">Chronological Audit</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {!summary?.recent_access || summary.recent_access.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                No file access events recorded yet.
              </div>
            ) : (
              summary.recent_access.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#05080C] border border-[#17232D] flex items-center justify-between hover:border-[#22B8FF]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0E2232] border border-[#16394F] flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#22B8FF]" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-[#F5F9FC] block truncate max-w-[200px]">
                        {item.filename}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {item.timeAgo || "just now"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${getActionColor(
                      item.action
                    )}`}
                  >
                    {item.action}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MOST ACCESSED */}
        <div className="p-6 rounded-2xl bg-[#080D12] border border-[#17232D]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#17232D]">
            <h2 className="text-base font-semibold text-[#F5F9FC] font-sans">
              Most Accessed
            </h2>
            <span className="text-xs font-mono text-[#64748B]">By Frequency</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {!summary?.most_accessed || summary.most_accessed.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                No file accesses recorded yet.
              </div>
            ) : (
              summary.most_accessed.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#05080C] border border-[#17232D] flex items-center justify-between hover:border-[#22B8FF]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#64748B] w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-medium text-[#F5F9FC] block truncate max-w-[220px]">
                        {item.filename}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        Last: {item.lastAction}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#0E2232] border border-[#16394F] text-[#22B8FF] font-semibold">
                    {item.accessCount} {item.accessCount === 1 ? "access" : "accesses"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
