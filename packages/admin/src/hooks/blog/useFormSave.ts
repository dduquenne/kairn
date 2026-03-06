'use client';

/**
 * @module useFormSave
 * @description Hook de sauvegarde du formulaire blog
 *
 * Utilise le toast depuis BlogAdminConfig au lieu de l'import direct.
 */

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { useBlogAdminConfig } from '../../components/blog/context';

import type { FormData } from './useFormData';

/**
 * Nettoie le chemin d'image en supprimant les paramètres de cache-busting
 */
function cleanImagePath(imagePath: string | undefined): string | undefined {
  if (!imagePath) return imagePath;
  return imagePath.split('?')[0];
}

/**
 * Hook de sauvegarde du formulaire blog
 */
export function useFormSave({
  formData,
  isEditing,
  post,
  validateForm,
  getDefaultJsonLd,
  jobId,
}: {
  formData: FormData;
  isEditing: boolean;
  post?: { slug: string };
  validateForm: () => boolean;
  getDefaultJsonLd: () => Record<string, unknown>;
  jobId?: string;
}) {
  const router = useRouter();
  const { toast } = useBlogAdminConfig();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Sauvegarde le formulaire (création ou mise à jour)
   */
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      toast.addToast({
        title: 'Veuillez corriger les erreurs ci-dessous',
        description: '',
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);

    try {
      const url = isEditing ? `/api/blog/posts/${post?.slug}` : '/api/blog/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const cleanedFaq = formData.faq.filter(faq => faq.question.trim() && faq.answer.trim());

      const generatedJsonLd = getDefaultJsonLd();

      const payload: Record<string, unknown> = {
        ...formData,
        image: cleanImagePath(formData.image),
        jsonLd: generatedJsonLd,
        faq: cleanedFaq.length > 0 ? cleanedFaq : undefined,
        ...(jobId && !isEditing ? { jobId } : {}),
      };

      if (isEditing && post?.slug !== formData.slug) {
        payload.oldSlug = post?.slug;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Échec lors de la ${isEditing ? 'modification' : 'création'} de l'article`
        );
      }

      toast.addToast({
        title: isEditing ? 'Article modifié avec succès' : 'Article créé avec succès',
        description: '',
        variant: 'success',
      });

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      toast.addToast({
        title: error instanceof Error ? error.message : "Échec de l'enregistrement de l'article",
        description: '',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, post, validateForm, toast, router, getDefaultJsonLd, jobId]);

  return {
    handleSave,
    isSaving,
  };
}
