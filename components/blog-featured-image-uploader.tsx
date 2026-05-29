"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BlogFeaturedImageUploaderProps {
  currentImageUrl?: string
  onImageUpload: (file: File) => Promise<string>
  onImageRemove?: () => void
}

export default function BlogFeaturedImageUploader({
  currentImageUrl,
  onImageUpload,
  onImageRemove,
}: BlogFeaturedImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Please upload an image file (JPEG, PNG, GIF, WebP)"
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be less than 5MB"
    }

    // Check specific image types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, GIF, and WebP images are supported"
    }

    return null
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload file
    setUploading(true)
    try {
      const uploadedUrl = await onImageUpload(file)
      setPreviewUrl(uploadedUrl)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    if (onImageRemove) {
      onImageRemove()
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {previewUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Featured image preview"
                fill
                className="object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">Featured image uploaded</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Change Image
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleRemove} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Upload Featured Image</p>
            <p className="text-gray-600 mb-4">Drag and drop or click to browse</p>
            <Button type="button" variant="outline" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-4">JPEG, PNG, GIF, WebP up to 5MB</p>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
          }
        }}
      />
    </div>
  )
}
