import { type NextRequest, NextResponse } from "next/server"
import { uploadBlogImage } from "@/lib/api/blog"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or superuser
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_superuser")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && !profile?.is_superuser) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as "featured" | "content") || "featured"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload image
    const result = await uploadBlogImage(file, folder)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error uploading blog image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 },
    )
  }
}
