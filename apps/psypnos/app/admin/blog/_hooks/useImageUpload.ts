import { useCallback, useState, useRef } from "react";
import { useToast } from "../../../../components/ui/toast";

/**
 * Custom hook for handling image file uploads
 *
 * Manages file input, validation, and upload process for blog post images.
 * Supports WebP format with file size validation and Base64 encoding for API transmission.
 *
 * @example
 * ```tsx
 * const {
 *   fileInputRef,
 *   isUploadingImage,
 *   handleUploadImage,
 *   handleImageInputChange,
 * } = useImageUpload(slug, (imagePath) => {
 *   setFormData(prev => ({ ...prev, image: imagePath }));
 * });
 *
 * <input
 *   ref={fileInputRef}
 *   type="file"
 *   accept=".webp"
 *   onChange={handleImageInputChange}
 *   className="hidden"
 * />
 *
 * <button onClick={() => fileInputRef.current?.click()}>
 *   Upload Image
 * </button>
 * ```
 *
 * @param slug - The blog post slug (required for upload)
 * @param onImageUploaded - Callback when image is successfully uploaded
 * @returns Object containing ref, state, and handlers for image upload
 */
export function useImageUpload(
  slug: string | undefined,
  onImageUploaded: (imagePath: string) => void
) {
  const { addToast } = useToast();

  // Ref for the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload loading state
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /**
   * Handle image file upload
   *
   * Performs the following steps:
   * 1. Validates slug exists
   * 2. Validates file type (must be WebP)
   * 3. Validates file size (max 10MB)
   * 4. Reads file as Base64
   * 5. Sends to upload API
   * 6. Updates form with uploaded image path
   *
   * @param file - The file to upload
   */
  const handleUploadImage = useCallback(async (file: File) => {
    // Check if slug exists
    if (!slug?.trim()) {
      addToast({
        title: "Veuillez d'abord générer un slug pour l'article",
        variant: "error",
      });
      return;
    }

    // Validate file type - accept WebP, JPEG, PNG
    const validTypes = ["image/webp", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      addToast({
        title: "Format non supporté. Utilisez JPG, PNG ou WebP.",
        variant: "error",
      });
      return;
    }

    // Validate file size - max 10MB
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        title: "L'image ne doit pas dépasser 10MB",
        variant: "error",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Read file as Base64
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string;

          // Send file to upload API
          const response = await fetch("/api/blog/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: slug,
              fileData: fileData,
              fileName: file.name,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors du téléchargement");
          }

          const data = await response.json();

          if (!data.success || !data.finalPath) {
            throw new Error("Impossible de sauvegarder l'image");
          }

          // Update form with uploaded image path
          onImageUploaded(data.finalPath);

          addToast({
            title: "Image téléchargée avec succès",
            description: "L'image a été sauvegardée et l'aperçu mis à jour",
            variant: "success",
          });
        } catch (error) {
          console.error("Error during file read:", error);
          addToast({
            title: error instanceof Error
              ? error.message
              : "Erreur lors du traitement du fichier",
            variant: "error",
          });
        } finally {
          setIsUploadingImage(false);
        }
      };

      reader.onerror = () => {
        addToast({
          title: "Erreur lors de la lecture du fichier",
          variant: "error",
        });
        setIsUploadingImage(false);
      };

      // Start reading the file
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Error uploading image:", error);
      addToast({
        title: error instanceof Error
          ? error.message
          : "Échec du téléchargement de l'image",
        variant: "error",
      });
      setIsUploadingImage(false);
    }
  }, [slug, onImageUploaded, addToast]);

  /**
   * Handle file input change event
   *
   * Extracts the selected file and initiates upload.
   * Resets the input value to allow uploading the same file again.
   *
   * @param e - The change event from file input
   */
  const handleImageInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      handleUploadImage(file);

      // Reset input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [handleUploadImage]);

  return {
    fileInputRef,
    isUploadingImage,
    handleUploadImage,
    handleImageInputChange,
  };
}
