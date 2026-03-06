'use client';

/**
 * @module useImageUpload
 * @description Hook de téléchargement d'images manuelles
 */

import { useCallback, useState, useRef } from 'react';

import { useBlogAdminConfig } from '../../components/blog/context';

/**
 * Hook de téléchargement d'images
 *
 * @param slug - Slug de l'article
 * @param onImageUploaded - Callback après upload
 */
export function useImageUpload(
  slug: string | undefined,
  onImageUploaded: (imagePath: string) => void
) {
  const { toast } = useBlogAdminConfig();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /**
   * Télécharge un fichier image
   */
  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!slug?.trim()) {
        toast.addToast({
          title: "Veuillez d'abord générer un slug pour l'article",
          description: '',
          variant: 'error',
        });
        return;
      }

      const validTypes = ['image/webp', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.addToast({
          title: 'Format non supporté. Utilisez JPG, PNG ou WebP.',
          description: '',
          variant: 'error',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.addToast({
          title: "L'image ne doit pas dépasser 10MB",
          description: '',
          variant: 'error',
        });
        return;
      }

      setIsUploadingImage(true);

      try {
        const reader = new FileReader();

        reader.onload = async e => {
          try {
            const fileData = e.target?.result as string;

            const response = await fetch('/api/blog/upload-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                slug,
                fileData,
                fileName: file.name,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Erreur lors du téléchargement');
            }

            const data = await response.json();

            if (!data.success || !data.finalPath) {
              throw new Error("Impossible de sauvegarder l'image");
            }

            onImageUploaded(data.finalPath);

            toast.addToast({
              title: 'Image téléchargée avec succès',
              description: "L'image a été sauvegardée et l'aperçu mis à jour",
              variant: 'success',
            });
          } catch (error) {
            console.error('Error during file read:', error);
            toast.addToast({
              title:
                error instanceof Error ? error.message : 'Erreur lors du traitement du fichier',
              description: '',
              variant: 'error',
            });
          } finally {
            setIsUploadingImage(false);
          }
        };

        reader.onerror = () => {
          toast.addToast({
            title: 'Erreur lors de la lecture du fichier',
            description: '',
            variant: 'error',
          });
          setIsUploadingImage(false);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.addToast({
          title: error instanceof Error ? error.message : "Échec du téléchargement de l'image",
          description: '',
          variant: 'error',
        });
        setIsUploadingImage(false);
      }
    },
    [slug, onImageUploaded, toast]
  );

  return {
    fileInputRef,
    isUploadingImage,
    handleUploadImage,
  };
}
