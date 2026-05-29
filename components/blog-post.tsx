"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Clock, ArrowLeft, MessageCircle, Send, Loader2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]
type BlogComment = Database["public"]["Tables"]["blog_comments"]["Row"]

interface BlogPostProps {
  slug: string
}

export function BlogPost({ slug }: BlogPostProps) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState({
    name: "",
    email: "",
    comment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadBlogPost()
    loadComments()
  }, [slug])

  const loadBlogPost = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch the blog post by slug
      const { data: postData, error: postError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single()

      if (postError) {
        if (postError.code === "PGRST116") {
          setError("Post not found")
        } else {
          throw postError
        }
        return
      }

      setPost(postData)

      // Increment view count
      const { error: viewError } = await supabase.rpc("increment_post_views", { post_id: postData.id })
      if (viewError) {
        console.error("Error incrementing view count:", viewError)
      }
    } catch (err) {
      console.error("Error loading blog post:", err)
      setError("Failed to load blog post")
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      setComments(data || [])
    } catch (err) {
      console.error("Error loading comments:", err)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.name || !newComment.email || !newComment.comment || !post) {
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("blog_comments")
        .insert({
          post_id: post.id,
          author_name: newComment.name,
          author_email: newComment.email,
          content: newComment.comment,
          is_approved: false, // Comments need approval by default
        })
        .select()
        .single()

      if (error) throw error

      // Show success message
      alert("Thank you for your comment! It will be visible after approval.")
      setNewComment({ name: "", email: "", comment: "" })
    } catch (err) {
      console.error("Error submitting comment:", err)
      alert("Failed to submit comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const text = content.replace(/<[^>]*>/g, "") // Strip HTML tags
    const wordCount = text.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-500 text-lg">Loading blog post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error === "Post not found"
              ? "The blog post you're looking for doesn't exist or has been removed."
              : "We encountered an error loading this blog post. Please try again later."}
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Back to Blog */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <Badge className="mb-4 bg-blue-600 hover:bg-blue-700">{post.category}</Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight text-balance">
              {post.title}
            </h1>

            {post.excerpt && <p className="text-xl text-gray-600 mb-6 leading-relaxed text-pretty">{post.excerpt}</p>}

            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>By Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{calculateReadTime(post.content)}</span>
              </div>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="mb-12">
              <Image
                src={post.featured_image_url || "/placeholder.svg"}
                alt={post.title}
                width={800}
                height={400}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Article Content */}
          <div
            className="prose prose-lg prose-blue max-w-none mb-12 
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-6 prose-ol:my-6
              prose-li:text-gray-700 prose-li:my-2
              prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Separator className="my-12" />

          {/* Comments Section */}
          <section className="mt-12">
            <div className="flex items-center gap-2 mb-8">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Comments ({comments.length})</h2>
            </div>

            {/* Comment Form */}
            <Card className="mb-8">
              <CardHeader>
                <h3 className="text-lg font-semibold">Leave a Comment</h3>
                <p className="text-sm text-gray-500">Your comment will be visible after approval by our team.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={newComment.name}
                        onChange={(e) => setNewComment((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={newComment.email}
                        onChange={(e) => setNewComment((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Comment *
                    </label>
                    <Textarea
                      id="comment"
                      value={newComment.comment}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, comment: e.target.value }))}
                      required
                      placeholder="Share your thoughts..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Comment
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{comment.author_name}</h4>
                          <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </article>
    </div>
  )
}
