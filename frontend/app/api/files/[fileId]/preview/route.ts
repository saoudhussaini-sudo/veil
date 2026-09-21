import { NextRequest, NextResponse } from "next/server";
import { DEMO_FILES } from "@/lib/demo-data";

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  const match = DEMO_FILES.find((f) => f.id === fileId);

  if (match) {
    return NextResponse.json({
      file: match,
      preview_type: "pdf",
      preview_data: { pages: 4 },
      extracted_text_preview: match.text_content,
    });
  }

  return NextResponse.json(
    {
      file: {
        id: fileId,
        filename: `${fileId}.pdf`,
        original_name: `${fileId}.pdf`,
        mime_type: "application/pdf",
        file_size: 1024,
        file_ext: ".pdf",
        preview_type: "pdf",
        processing_status: "ready",
        index_status: "ready",
        chunk_count: 1,
        is_searchable: true,
        created_at: Date.now() / 1000,
      },
      preview_type: "text",
      preview_data: {},
      extracted_text_preview: "Document loaded.",
    }
  );
}
