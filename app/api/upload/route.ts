import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import sharp from "sharp"
import path from "path"
import fs from "fs/promises"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    const ext = file.name.split('.').pop()?.toLowerCase() || "jpg"
    const fileName = `poster-${Date.now()}-${Math.round(Math.random() * 1000)}.${ext === 'png' ? 'png' : 'webp'}`
    const uploadDir = path.join(process.cwd(), "public/uploads/posters")

    // Ensure directory exists
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, fileName)

    // Process and compress image using sharp
    let sharpInstance = sharp(buffer).resize({
      width: 800, // max width 800px, preserves aspect ratio
      withoutEnlargement: true
    })

    if (ext === 'png') {
      sharpInstance = sharpInstance.png({ quality: 80 })
    } else {
      sharpInstance = sharpInstance.webp({ quality: 80 })
    }

    await sharpInstance.toFile(filePath)

    return NextResponse.json({ url: `/uploads/posters/${fileName}` })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
