"use client";

import { useState, useCallback } from "react";
import { X, Upload, Check, Search, Image as ImageIcon } from "lucide-react";
import { cn } from "@kairn/ui";

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  alt?: string;
  width?: number;
  height?: number;
  createdAt?: Date;
}

export interface ImageSelectionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when an image is selected */
  onSelect: (image: ImageItem) => void;
  /** Available images to choose from */
  images: ImageItem[];
  /** Callback to upload a new image */
  onUpload?: (file: File) => Promise<ImageItem>;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Title of the modal */
  title?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Upload label */
  uploadLabel?: string;
  /** Custom class names */
  className?: string;
}

/**
 * ImageSelectionModal - Modal for selecting or uploading images
 *
 * @example
 * ```tsx
 * <ImageSelectionModal
 *   open={showImageModal}
 *   onClose={() => setShowImageModal(false)}
 *   onSelect={(image) => setFeaturedImage(image.url)}
 *   images={mediaLibrary}
 *   onUpload={handleImageUpload}
 * />
 * ```
 */
export function ImageSelectionModal({
  open,
  onClose,
  onSelect,
  images,
  onUpload,
  isUploading = false,
  title = "Select Image",
  searchPlaceholder = "Search images...",
  uploadLabel = "Upload new image",
  className,
}: ImageSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const filteredImages = images.filter(
    (img) =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.alt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !onUpload) return;

      const file = files[0];
      if (!file || !file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      try {
        const newImage = await onUpload(file);
        onSelect(newImage);
        onClose();
      } catch (error) {
        console.error("Upload failed:", error);
      }
    },
    [onUpload, onSelect, onClose]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleSelectImage = () => {
    const image = images.find((img) => img.id === selectedId);
    if (image) {
      onSelect(image);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={cn(
          "flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-gold/30 bg-night/95 shadow-xl",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 p-4">
          <h2 className="text-lg font-semibold text-gold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ivory/70 transition hover:bg-night/60 hover:text-ivory"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Upload */}
        <div className="flex flex-wrap items-center gap-4 border-b border-gold/20 p-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory/50"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gold/30 bg-night/50 py-2 pl-10 pr-4 text-ivory focus:border-gold focus:outline-none"
            />
          </div>

          {onUpload && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold transition hover:bg-gold/20">
              <Upload size={16} />
              {isUploading ? "Uploading..." : uploadLabel}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        {/* Image Grid */}
        <div
          className={cn(
            "flex-1 overflow-auto p-4",
            dragOver && "bg-gold/5"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {filteredImages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-ivory/50">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>No images found</p>
              {onUpload && (
                <p className="mt-2 text-sm">Drag and drop an image or click upload</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {filteredImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedId(image.id)}
                  onDoubleClick={() => {
                    onSelect(image);
                    onClose();
                  }}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border-2 transition",
                    selectedId === image.id
                      ? "border-gold ring-2 ring-gold/50"
                      : "border-gold/20 hover:border-gold/50"
                  )}
                >
                  <img
                    src={image.url}
                    alt={image.alt || image.name}
                    className="h-full w-full object-cover"
                  />
                  {selectedId === image.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gold/20">
                      <Check size={24} className="text-gold" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                    <p className="truncate text-xs text-ivory">{image.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gold/20 p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gold/30 px-4 py-2 text-sm text-ivory/70 transition hover:bg-gold/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectImage}
            disabled={!selectedId}
            className="rounded-md bg-gold/20 border border-gold/50 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
