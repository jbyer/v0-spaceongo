"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, ArrowRight, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(["All"])

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadBlogPosts()

    // Set up real-time subscription for new published posts
    const channel = supabase
      .channel("public_blog_posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blog_posts",
          filter: "status=eq.published",
        },
        (payload) => {
          console.log("[v0] Real-time blog post change on public page:", payload)

          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as BlogPost, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) => prev.map((post) => (post.id === payload.new.id ? (payload.new as BlogPost) : post)))
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((post) => post.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadBlogPosts = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })

      if (error) throw error

      setPosts(data || [])

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map((post) => post.category) || []))
      setCategories(["All", ...uniqueCategories])
    } catch (error) {
      console.error("Error loading blog posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = posts

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((post) => post.category === selectedCategory)
    }

    setFilteredPosts(filtered)
  }, [searchTerm, selectedCategory, posts])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Draft"
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

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">SpaceOnGo Blog</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover insights, tips, and inspiration for making the most of your space rental experience
          </p>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-gray-500 text-lg">Loading blog posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <Image
                      src={post.featured_image_url || "/placeholder.svg?height=240&width=400"}
                      alt={post.title}
                      width={400}
                      height={240}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700">{post.category}</Badge>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.published_at)}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{calculateReadTime(post.content)}</span>
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm" className="group/btn">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
