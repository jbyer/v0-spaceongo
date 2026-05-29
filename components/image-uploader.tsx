"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Star, CheckCircle, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import Image from "next/image"

interface ImageUploaderProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  existingImages?: string[]
  onExistingImagesChange?: (images: string[]) => void
}

export default function ImageUploader({ 
  images, 
  onImagesChange, 
  existingImages = [],
  onExistingImagesChange 
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const isValidType = file.type.startsWith("image/")
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })

    const updatedImages = [...images, ...validFiles].slice(0, 10) // Max 10 images
    onImagesChange(updatedImages)
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    onImagesChange(updatedImages)
  }

  const moveImageUp = (index: number) => {
    if (index === 0) return
    const updatedImages = [...images]
    ;[updatedImages[index - 1], updatedImages[index]] = [updatedImages[index], updatedImages[index - 1]]
    onImagesChange(updatedImages)
  }

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return
    const updatedImages = [...images]
    ;[updatedImages[index], updatedImages[index + 1]] = [updatedImages[index + 1], updatedImages[index]]
    onImagesChange(updatedImages)
  }

  // Existing images management
  const moveExistingImageUp = (index: number) => {
    if (index === 0 || !onExistingImagesChange) return
    const updatedImages = [...existingImages]
    ;[updatedImages[index - 1], updatedImages[index]] = [updatedImages[index], updatedImages[index - 1]]
    onExistingImagesChange(updatedImages)
  }

  const moveExistingImageDown = (index: number) => {
    if (index === existingImages.length - 1 || !onExistingImagesChange) return
    const updatedImages = [...existingImages]
    ;[updatedImages[index], updatedImages[index + 1]] = [updatedImages[index + 1], updatedImages[index]]
    onExistingImagesChange(updatedImages)
  }

  const removeExistingImage = (index: number) => {
    if (!onExistingImagesChange) return
    const updatedImages = existingImages.filter((_, i) => i !== index)
    onExistingImagesChange(updatedImages)
  }

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDraggedOverIndex(index)
  }

  const handleDropReorder = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault()
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null)
      setDraggedOverIndex(null)
      return
    }

    const updatedImages = [...images]
    const draggedImage = updatedImages[draggingIndex]
    updatedImages.splice(draggingIndex, 1)
    updatedImages.splice(targetIndex, 0, draggedImage)
    
    onImagesChange(updatedImages)
    setDraggingIndex(null)
    setDraggedOverIndex(null)
  }

  const handleDragLeave = () => {
    setDraggedOverIndex(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">
            Photos ({images.length}/10) {images.length < 4 && <span className="text-red-600">*</span>}
          </h4>
          {images.length >= 4 && images.length <= 10 && (
            <span className="text-green-600 text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Requirements met
            </span>
          )}
          {images.length < 4 && (
            <span className="text-red-600 text-sm font-medium">{4 - images.length} more required</span>
          )}
          {images.length > 10 && (
            <span className="text-red-600 text-sm font-medium">
              Remove {images.length - 10} image{images.length - 10 !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Required:</strong> Upload 4-10 high-quality photos of your space. The first photo will be your main
          listing photo.
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : images.length < 4 ? "border-red-300" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`h-12 w-12 mx-auto mb-4 ${images.length < 4 ? "text-red-400" : "text-gray-400"}`} />
          <p className="text-lg font-medium mb-2">Drop your images here</p>
          <p className="text-gray-600 mb-4">or</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 10}
          >
            {images.length >= 10 ? "Maximum Reached" : "Browse Files"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(Array.from(e.target.files))
              }
            }}
            disabled={images.length >= 10}
          />
          <p className="text-xs text-gray-500 mt-4">
            JPG, PNG, GIF up to 5MB each. <strong>Minimum 4 photos required, maximum 10.</strong>
          </p>
        </CardContent>
      </Card>

      {/* Existing Images Section */}
      {existingImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">Current Images</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {existingImages.length} image{existingImages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GripVertical className="w-4 h-4" />
            <span>Drag to reorder. Remove images you don&apos;t want to keep.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                className="relative group"
              >
                <div className="aspect-square relative overflow-hidden rounded-lg border border-blue-200 bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={`Existing ${index + 1}`}
                    fill
                    className="object-cover"
                  />

                  {/* Position Badge */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-medium">
                    #{index + 1}
                  </div>

                  {/* Existing Image Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Main
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-2">
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => moveExistingImageUp(index)}
                        >
                          <ChevronUp className="h-3 w-3" />
                          Move Up
                        </Button>
                      )}
                      {index < existingImages.length - 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => moveExistingImageDown(index)}
                        >
                          <ChevronDown className="h-3 w-3" />
                          Move Down
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Images Upload Section */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">New Images</h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GripVertical className="w-4 h-4" />
            <span>Drag to reorder images. First image will be displayed first on the profile.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropReorder(index, e)}
                className={`relative group cursor-move transition-all ${
                  draggingIndex === index ? "opacity-50" : ""
                } ${draggingIndex !== null && draggedOverIndex === index ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
              >
                <div className="aspect-square relative overflow-hidden rounded-lg border bg-gray-100">
                  <Image
                    src={URL.createObjectURL(image) || "/placeholder.svg"}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />

                  {/* Position Badge */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-medium">
                    #{index + 1}
                  </div>

                  {/* Main Photo Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Main
                    </div>
                  )}

                  {/* Drag Handle Overlay */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white p-1.5 rounded">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-2">
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => moveImageUp(index)}
                        >
                          <ChevronUp className="h-3 w-3" />
                          Move Up
                        </Button>
                      )}
                      {index < images.length - 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => moveImageDown(index)}
                        >
                          <ChevronDown className="h-3 w-3" />
                          Move Down
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
