import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogPost } from "@/components/blog-post"
import { createMetadata } from "@/lib/seo/metadata"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const supabase = createClient()

  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, featured_image_url, tags, category")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (!post) {
    return createMetadata({
      title: "Blog Post Not Found",
      description: "The blog post you're looking for doesn't exist.",
      path: `/blog/${params.slug}`,
      noIndex: true,
    })
  }

  return createMetadata({
    title: post.title,
    description: post.excerpt || `Read about ${post.title} on the SpaceOnGo blog.`,
    keywords: post.tags || [post.category, "workspace", "blog"],
    image: post.featured_image_url || undefined,
    path: `/blog/${params.slug}`,
  })
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <BlogPost slug={params.slug} />
      </main>
      <SiteFooter />
    </div>
  )
}
