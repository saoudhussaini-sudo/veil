import { NextResponse } from "next/server";
import { DEMO_FILES } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({
    total_files: DEMO_FILES.length,
    files: DEMO_FILES,
  });
}
