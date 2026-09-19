"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Search,
  BarChart2,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
  FileCheck
} from "lucide-react";
import { fetchAnalytics, fetchFiles, AnalyticsSummary, FileItem } from "@/lib/api";

export default function HomeBottomGrid() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    fetchAnalytics()
      .then(setAnalytics)
      .catch(() => {});

    fetchFiles()
      .then((data) => {
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
        }
      })
      .catch(() => {});
  }, []);

  // Format file size
  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Recent files fallback to demo if none uploaded yet
  const displayFiles = files.length > 0
    ? files.slice(0, 3).map((f) => ({
        name: f.original_name || f.filename,
        ext: (f.file_ext || f.filename.split(".").pop() || "txt").toUpperCase(),
        size: formatSize(f.file_size),
        status: f.index_status === "INDEXED" ? "Indexed" : "Ready",
        timeAgo: "Recently",
      }))
    : [
        { name: "research.pdf", ext: "PDF", size: "2.4 MB", status: "Indexed", timeAgo: "2 hours ago" },
        { name: "dataset.xlsx", ext: "XLSX", size: "1.1 MB", status: "Indexed", timeAgo: "4 hours ago" },
        { name: "notes.md", ext: "MD", size: "12 KB", status: "Ready", timeAgo: "1 day ago" },
      ];

  // Helper for file icon badge
  const getFileBadge = (ext: string) => {
    switch (ext.toUpperCase()) {
      case "PDF":
        return <div className="w-8 h-8 rounded-lg bg-[#3A1417] text-[#FF4D4D] border border-[#551E22] flex items-center justify-center text-[10px] font-bold font-mono">PDF</div>;
      case "XLSX":
      case "CSV":
        return <div className="w-8 h-8 rounded-lg bg-[#0F2D1F] text-[#32D583] border border-[#16442E] flex items-center justify-center text-[10px] font-bold font-mono">XLSX</div>;
      case "MD":
      case "TXT":
        return <div className="w-8 h-8 rounded-lg bg-[#0E2232] text-[#22B8FF] border border-[#16394F] flex items-center justify-center text-[10px] font-bold font-mono">MD</div>;
      default:
        return <div className="w-8 h-8 rounded-lg bg-[#141A22] text-[#94A3B8] border border-[#1E293B] flex items-center justify-center text-[10px] font-bold font-mono">{ext.slice(0, 3)}</div>;
    }
  };

  // Helper for recent activity rows
  const displayActivity = (analytics?.recent_access && analytics.recent_access.length > 0)
    ? analytics.recent_access.slice(0, 4).map((a) => ({
        name: a.filename,
        action: a.action,
        timeAgo: a.timeAgo || "just now",
        ext: a.filename.split(".").pop()?.toUpperCase() || "DOC"
      }))
    : [
        { name: "research.pdf", action: "Analyzed", timeAgo: "2 minutes ago", ext: "PDF" },
        { name: "dataset.xlsx", action: "Retrieved", timeAgo: "8 minutes ago", ext: "XLSX" },
        { name: "notes.md", action: "Viewed", timeAgo: "15 minutes ago", ext: "MD" },
        { name: "report-A.pdf", action: "Compared", timeAgo: "1 hour ago", ext: "PDF" },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
      {/* 1. Recent Files */}
      <div className="rounded-2xl bg-[#080D12] border border-[#17232D] p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#17232D]">
            <h3 className="text-sm font-semibold text-[#F5F9FC]">Recent Files</h3>
            <Link
              href="/files"
              className="text-xs text-[#22B8FF] hover:text-[#29C7FF] transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {displayFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#0E1620] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileBadge(file.ext)}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#F5F9FC] truncate max-w-[150px]">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      {file.size} &middot; {file.ext}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#32D583]" />
                    <span className="text-[11px] text-[#94A3B8]">{file.status}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] font-mono mt-0.5">
                    {file.timeAgo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Data accessed offline */}
      <div className="rounded-2xl bg-[#080D12] border border-[#17232D] p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#17232D]">
            <h3 className="text-sm font-semibold text-[#F5F9FC]">Data accessed offline</h3>
            <button className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#F5F9FC] px-2 py-0.5 rounded-lg bg-[#0E1620] border border-[#17232D]">
              <span>Last 7 days</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Box 1: Files accessed */}
            <div className="p-3.5 rounded-xl bg-[#05080C] border border-[#17232D] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0E2232] border border-[#16394F] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[#22B8FF]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#F5F9FC] font-sans">
                  {analytics?.files_accessed ?? 24}
                </p>
                <p className="text-[10px] text-[#94A3B8] font-mono leading-tight">
                  Files accessed
                </p>
              </div>
            </div>

            {/* Box 2: Offline queries */}
            <div className="p-3.5 rounded-xl bg-[#05080C] border border-[#17232D] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0E2232] border border-[#16394F] flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-[#22B8FF]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#F5F9FC] font-sans">
                  {analytics?.offline_queries ?? 128}
                </p>
                <p className="text-[10px] text-[#94A3B8] font-mono leading-tight">
                  Offline queries
                </p>
              </div>
            </div>

            {/* Box 3: Moss retrievals */}
            <div className="p-3.5 rounded-xl bg-[#05080C] border border-[#17232D] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0E2232] border border-[#16394F] flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-[#22B8FF]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#F5F9FC] font-sans">
                  {analytics?.moss_retrievals ?? 342}
                </p>
                <p className="text-[10px] text-[#94A3B8] font-mono leading-tight">
                  Moss retrievals
                </p>
              </div>
            </div>

            {/* Box 4: Local analyses */}
            <div className="p-3.5 rounded-xl bg-[#05080C] border border-[#17232D] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0E2232] border border-[#16394F] flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4 text-[#22B8FF]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#F5F9FC] font-sans">
                  {analytics?.local_analyses ?? 86}
                </p>
                <p className="text-[10px] text-[#94A3B8] font-mono leading-tight">
                  Local analyses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity */}
      <div className="rounded-2xl bg-[#080D12] border border-[#17232D] p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#17232D]">
            <h3 className="text-sm font-semibold text-[#F5F9FC]">Recent Activity</h3>
            <Link
              href="/activity"
              className="text-xs text-[#22B8FF] hover:text-[#29C7FF] transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {displayActivity.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#0E1620] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileBadge(act.ext)}
                  <span className="font-medium text-[#F5F9FC] truncate max-w-[130px]">
                    {act.name}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-[#94A3B8]">{act.action}</span>
                  <span className="text-[10px] font-mono text-[#64748B] w-20 text-right">
                    {act.timeAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
