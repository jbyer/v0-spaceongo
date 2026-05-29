import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]
type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"]
type BlogPostUpdate = Database["public"]["Tables"]["blog_posts"]["Update"]

export async function uploadBlogImage(file: File, folder: "featured" | "content" = "featured") {
  const supabase = await createClient()

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be less than 5MB")
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from("blog-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName)

  return {
    url: data.publicUrl,
    path: fileName,
  }
}

export async function deleteBlogImage(filePath: string) {
  const supabase = await createClient()

  const { error } = await supabase.storage.from("blog-images").remove([filePath])

  if (error) throw error
}

export async function createBlogPost(post: BlogPostInsert) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("blog_posts").insert(post).select().single()

  if (error) throw error
  return data
}

export async function updateBlogPost(postId: string, updates: BlogPostUpdate) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("blog_posts").update(updates).eq("id", postId).select().single()

  if (error) throw error
  return data
}

export async function getBlogPosts(status?: "draft" | "published") {
  const supabase = await createClient()

  let query = supabase.from("blog_posts").select("*").order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getBlogPost(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function deleteBlogPost(postId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("blog_posts").delete().eq("id", postId)

  if (error) throw error
}
