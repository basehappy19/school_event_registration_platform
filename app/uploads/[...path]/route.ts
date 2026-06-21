import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { existsSync } from "fs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const filePath = path.join(process.cwd(), "public", "uploads", ...resolvedParams.path)

  if (!existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  try {
    const fileBuffer = await fs.readFile(filePath)
    
    // Determine content type
    const ext = path.extname(filePath).toLowerCase()
    let contentType = "application/octet-stream"
    if (ext === ".webp") contentType = "image/webp"
    else if (ext === ".png") contentType = "image/png"
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
