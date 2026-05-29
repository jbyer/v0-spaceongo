"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PlusCircle, Save, Eye, Trash2, Edit, CalendarIcon, Tag, FileText, CheckCircle, Loader2 } from "lucide-react"
import BlogFeaturedImageUploader from "@/components/blog-featured-image-uploader"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"
import { format } from "date-fns"

declare global {
  interface Window {
    Quill: any
  }
}

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]
type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"]

const defaultCategories = [
  "Hosting Tips",
  "Inspiration",
  "Event Planning",
  "Remote Work",
  "Photography",
  "Sustainability",
]

export default function AdminBlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [publicationDate, setPublicationDate] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    newCategory: "",
    tags: "",
    featuredImage: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const editorRef = useRef<any>(null)
  const quillRef = useRef<any>(null)
  const [isEditorLoaded, setIsEditorLoaded] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const loadQuill = async () => {
      const quillCSS = document.createElement("link")
      quillCSS.rel = "stylesheet"
      quillCSS.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css"
      document.head.appendChild(quillCSS)

      const quillScript = document.createElement("script")
      quillScript.src = "https://cdn.quilljs.com/1.3.6/quill.min.js"
      quillScript.onload = () => {
        setIsEditorLoaded(true)
      }
      document.head.appendChild(quillScript)
    }

    loadQuill()

    return () => {
      const quillCSS = document.querySelector('link[href*="quill.snow.css"]')
      const quillScript = document.querySelector('script[src*="quill.min.js"]')
      if (quillCSS && document.head.contains(quillCSS)) {
        document.head.removeChild(quillCSS)
      }
      if (quillScript && document.head.contains(quillScript)) {
        document.head.removeChild(quillScript)
      }
    }
  }, [])

  useEffect(() => {
    if (isEditorLoaded && isCreating && window.Quill && !quillRef.current) {
      initializeQuill()
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    }
  }, [isEditorLoaded, isCreating])

  useEffect(() => {
    loadBlogPosts()
    loadCategories()
    getCurrentUser()

    const channel = supabase
      .channel("blog_posts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blog_posts",
        },
        (payload) => {
          console.log("[v0] Real-time blog post change:", payload)

          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as BlogPost, ...prev])
            const newPost = payload.new as BlogPost
            if (newPost.category) {
              updateCategoriesList(newPost.category)
            }
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) => prev.map((post) => (post.id === payload.new.id ? (payload.new as BlogPost) : post)))
            const updatedPost = payload.new as BlogPost
            if (updatedPost.category) {
              updateCategoriesList(updatedPost.category)
            }
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((post) => post.id !== payload.old.id))
            loadCategories()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  const loadBlogPosts = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error("Error loading blog posts:", error)
      setMessage({ type: "error", text: "Failed to load blog posts" })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("category")
        .not("category", "is", null)
        .order("category")

      if (error) throw error

      // Extract unique categories from posts
      const uniqueCategories = Array.from(new Set(data?.map((post) => post.category) || []))

      // Combine with default categories and remove duplicates
      const allCategories = Array.from(new Set([...defaultCategories, ...uniqueCategories]))

      // Sort alphabetically
      allCategories.sort()

      setCategories(allCategories)
    } catch (error) {
      console.error("Error loading categories:", error)
      // Fallback to default categories if there's an error
      setCategories(defaultCategories)
    }
  }

  const updateCategoriesList = (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories((prev) => {
        const updated = [...prev, newCategory]
        updated.sort()
        return updated
      })
    }
  }

  const initializeQuill = () => {
    if (window.Quill && editorRef.current && !quillRef.current) {
      const toolbarOptions = [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ]

      quillRef.current = new window.Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: toolbarOptions,
          history: {
            delay: 1000,
            maxStack: 50,
            userOnly: false,
          },
        },
        formats: [
          "header",
          "font",
          "size",
          "bold",
          "italic",
          "underline",
          "strike",
          "color",
          "background",
          "script",
          "list",
          "bullet",
          "indent",
          "direction",
          "align",
          "blockquote",
          "code-block",
          "link",
          "image",
          "video",
        ],
        placeholder: "Start writing your blog post content...",
        readOnly: false,
      })

      if (formData.content) {
        quillRef.current.root.innerHTML = formData.content
      }

      const toolbar = quillRef.current.getModule("toolbar")
      toolbar.addHandler("image", handleQuillImageUpload)

      quillRef.current.on("text-change", () => {
        const content = quillRef.current.root.innerHTML
        setFormData((prev) => ({ ...prev, content }))
      })
    }
  }

  const handleQuillImageUpload = () => {
    const input = document.createElement("input")
    input.setAttribute("type", "file")
    input.setAttribute("accept", "image/*")
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "content")

        const response = await fetch("/api/blog/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        const { url } = await response.json()

        const range = quillRef.current.getSelection()
        quillRef.current.insertEmbed(range.index, "image", url)
        quillRef.current.setSelection(range.index + 1)
      } catch (error) {
        console.error("Error uploading image:", error)
        setMessage({ type: "error", text: "Failed to upload image to content" })
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === "content" && quillRef.current) {
      quillRef.current.root.innerHTML = value
    }
  }

  const handleFeaturedImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "featured")

    const response = await fetch("/api/blog/upload-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to upload image")
    }

    const { url } = await response.json()
    setFormData((prev) => ({ ...prev, featuredImage: url }))
    return url
  }

  const handleFeaturedImageRemove = () => {
    setFormData((prev) => ({ ...prev, featuredImage: "" }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const text = content.replace(/<[^>]*>/g, "") // Strip HTML tags
    const wordCount = text.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  const handleSavePost = async (status: "draft" | "published") => {
    if (!formData.title || !formData.content) {
      setMessage({ type: "error", text: "Title and content are required" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (!currentUserId) {
      setMessage({ type: "error", text: "You must be logged in to create posts" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    const category = formData.newCategory || formData.category
    if (!category) {
      setMessage({ type: "error", text: "Please select or enter a category" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (status === "published") {
      if (!publicationDate) {
        setMessage({ type: "error", text: "Please select a publication date for published posts" })
        setTimeout(() => setMessage(null), 3000)
        return
      }

      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

      if (publicationDate > oneYearFromNow) {
        setMessage({ type: "error", text: "Publication date cannot be more than one year in the future" })
        setTimeout(() => setMessage(null), 3000)
        return
      }
    }

    try {
      setIsSaving(true)

      const postData: BlogPostInsert = {
        author_id: currentUserId,
        title: formData.title,
        slug: generateSlug(formData.title),
        excerpt: formData.excerpt || formData.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...",
        content: formData.content,
        featured_image_url: formData.featuredImage || null,
        category: category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status,
        published_at: status === "published" && publicationDate ? publicationDate.toISOString() : null,
      }

      if (editingPost) {
        const { error } = await supabase.from("blog_posts").update(postData).eq("id", editingPost.id)

        if (error) throw error
        setMessage({ type: "success", text: "Blog post updated successfully!" })
      } else {
        const { error } = await supabase.from("blog_posts").insert(postData)

        if (error) throw error
        setMessage({
          type: "success",
          text: `Blog post ${status === "published" ? "published" : "saved as draft"} successfully!`,
        })
      }

      if (category) {
        updateCategoriesList(category)
      }

      setFormData({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        newCategory: "",
        tags: "",
        featuredImage: "",
      })
      setPublicationDate(undefined)
      setIsCreating(false)
      setEditingPost(null)

      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error saving blog post:", error)
      setMessage({ type: "error", text: "Failed to save blog post" })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      category: post.category,
      newCategory: "",
      tags: post.tags?.join(", ") || "",
      featuredImage: post.featured_image_url || "",
    })
    if (post.published_at) {
      setPublicationDate(new Date(post.published_at))
    }
    setIsCreating(true)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", postId)

      if (error) throw error

      setMessage({ type: "success", text: "Blog post deleted successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error deleting blog post:", error)
      setMessage({ type: "error", text: "Failed to delete blog post" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const cancelEditing = () => {
    if (quillRef.current) {
      quillRef.current = null
    }

    setIsCreating(false)
    setEditingPost(null)
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      newCategory: "",
      tags: "",
      featuredImage: "",
    })
    setPublicationDate(undefined)
    setIsDatePickerOpen(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-2">Create and manage blog posts for the SpaceOnGo blog</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Blog Post
          </Button>
        )}
      </div>

      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CheckCircle className={`h-4 w-4 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} />
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Blog Post Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter an engaging title for your blog post"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Select Category ({categories.length} available)</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose existing category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newCategory">Or Create New Category</Label>
                <Input
                  id="newCategory"
                  value={formData.newCategory}
                  onChange={(e) => handleInputChange("newCategory", e.target.value)}
                  placeholder="Enter new category name"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  New categories are automatically added to the dropdown for future posts
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="publication-date">Publication Date *</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="publication-date"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal mt-1 ${
                      !publicationDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {publicationDate ? format(publicationDate, "PPP") : "Click to select publication date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={publicationDate}
                    onSelect={(date) => {
                      setPublicationDate(date)
                      setIsDatePickerOpen(false)
                    }}
                    initialFocus
                    disabled={(date) => {
                      const oneYearFromNow = new Date()
                      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
                      return date > oneYearFromNow
                    }}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-gray-500 mt-2">
                {publicationDate
                  ? `Post will be published on ${format(publicationDate, "MMMM d, yyyy")}`
                  : "Choose when this post should be published. You can schedule posts for future dates or backdate them."}
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt (Optional)</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                placeholder="Brief description that appears in the blog listing (auto-generated if left empty)"
                className="mt-1 h-20"
              />
            </div>

            <div>
              <Label>Featured Image *</Label>
              <div className="mt-1">
                <BlogFeaturedImageUploader
                  currentImageUrl={formData.featuredImage}
                  onImageUpload={handleFeaturedImageUpload}
                  onImageRemove={handleFeaturedImageRemove}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This image will appear at the top of your blog post and in the blog listing
              </p>
            </div>

            <div>
              <Label htmlFor="blog-content-editor">Blog Content *</Label>
              <div className="mt-1">
                {isEditorLoaded ? (
                  <div
                    ref={editorRef}
                    id="blog-content-editor"
                    className="min-h-[400px] border rounded-md bg-white"
                    style={{ minHeight: "400px" }}
                  />
                ) : (
                  <div className="border rounded-md p-4 bg-gray-50 text-center">
                    <div className="animate-pulse">Loading Quill.js rich text editor...</div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-2 flex items-center justify-between">
                <span>Use the image button in the toolbar to upload images directly into your content</span>
                <span>Estimated read time: {calculateReadTime(formData.content)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="hosting, tips, guide"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => handleSavePost("draft")} variant="outline" className="flex-1" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSavePost("published")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                Publish Post
              </Button>
              <Button onClick={cancelEditing} variant="ghost" disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Published Blog Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-gray-500">Loading blog posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No blog posts yet. Create your first post to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                        <Badge variant="outline">{post.category}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {post.tags.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEditPost(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
