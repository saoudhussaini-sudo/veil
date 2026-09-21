import { NextResponse } from "next/server";
import { DEMO_FILES } from "@/lib/demo-data";

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Loaded 2 comprehensive demo study documents.",
    files: DEMO_FILES,
    count: DEMO_FILES.length,
  });
}
