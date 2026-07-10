import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { uploadToBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";
// Permite uploads maiores (vídeos)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }

    const blob = file as File;
    const contentType = blob.type || "application/octet-stream";
    const isVideo = contentType.startsWith("video/");
    const isImage = contentType.startsWith("image/");
    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: "Envie uma imagem ou vídeo." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const url = await uploadToBlob(buffer, contentType, blob.name);

    return NextResponse.json({
      url,
      mediaType: isVideo ? "video" : "image",
      contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
