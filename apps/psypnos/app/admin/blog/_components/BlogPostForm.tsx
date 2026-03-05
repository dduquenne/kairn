'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Image as ImageIcon,
  Settings,
  Sparkles,
  Save,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Tabs } from '@/components/ui/Tabs';
import { BlogPost } from '@/lib/blog';
import { useToast } from '@/lib/toast-context';

import { useArticleGeneration } from '../_hooks/useArticleGeneration';
import { useFormData } from '../_hooks/useFormData';
import { useFormSave } from '../_hooks/useFormSave';
import { useFormValidation } from '../_hooks/useFormValidation';
import { useImageUpload } from '../_hooks/useImageUpload';
import { useJsonLdGeneration } from '../_hooks/useJsonLdGeneration';
import { useOneClickImageGeneration } from '../_hooks/useOneClickImageGeneration';
import { useTagManagement } from '../_hooks/useTagManagement';
import { useTextImprovement } from '../_hooks/useTextImprovement';
import { generateSlugFromTitleAndCategory } from '../_utils/generateSlug';

import { ModalContainer } from './ModalContainer';
import { SocialDiffusionSection } from './SocialDiffusionSection';
import { EssentialsTab, ContentTab, MediaTab, AdvancedOptionsTab } from './tabs';

interface BlogPostFormProps {
  post?: BlogPost;
  jobId?: string;
}

export function BlogPostForm({ post, jobId }: BlogPostFormProps) {
  const router = useRouter();
  const isEditing = !!post;
  const [activeTab, setActiveTab] = useState('essentials');
  const [isLoadingJob, setIsLoadingJob] = useState(!!jobId);

  const { addToast } = useToast();

  // Form Management Hooks
  const { formData, updateFormData, setFormData } = useFormData();
  const { errors, validateForm, clearError } = useFormValidation(formData);
  const { tagInput, setTagInput, handleAddTag, handleRemoveTag } = useTagManagement(
    formData,
    updateFormData
  );

  // Persistence Hooks
  const { getDefaultJsonLd } = useJsonLdGeneration(formData);
  const { isSaving, handleSave } = useFormSave({
    formData,
    isEditing,
    post,
    validateForm,
    getDefaultJsonLd,
    jobId,
  });

  // Simplified one-click image generation (must be before useArticleGeneration for auto-generation)
  const {
    isGeneratingPrompt,
    isGeneratingImages,
    isRegeneratingPrompt,
    imageProposals,
    generateImage,
    generateImageFromArticleData,
    selectProposal,
    regenerateImages,
    regeneratePrompt,
  } = useOneClickImageGeneration(formData, updateFormData);

  // AI Feature Hooks
  const { isGeneratorModalOpen, setIsGeneratorModalOpen, handleGenerateArticleData } =
    useArticleGeneration(updateFormData, formData.image, generateImageFromArticleData);

  const {
    isImproverOpen,
    setIsImproverOpen,
    isTextImproverOpen,
    setIsTextImproverOpen,
    selectedTextToImprove,
    handleImproveContent,
    handleImproveSelection,
    handleImproveSelectedText,
  } = useTextImprovement(formData, updateFormData);

  // Manual image upload
  const { isUploadingImage, handleUploadImage } = useImageUpload(formData.slug, imagePath =>
    updateFormData({ image: imagePath })
  );

  // Initialize form with post data when editing
  useEffect(() => {
    if (post) {
      setFormData({
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        author: post.author,
        category: post.category,
        tags: post.tags,
        image: post.image,
        published: post.published,
        featured: post.featured ?? false,
        date: post.date,
        faq: post.faq || [],
        jsonLd: post.jsonLd,
        imagePrompt: post.imagePrompt,
        seoIntent: post.seoIntent,
        persona: post.persona,
        tones: post.tones || [],
      });
    }
  }, [post, setFormData]);

  // Load data from a completed job (when coming from /admin/blog/jobs)
  useEffect(() => {
    if (!jobId) return;

    const loadJobData = async () => {
      try {
        setIsLoadingJob(true);
        const response = await fetch(`/api/blog/jobs/${jobId}`);

        if (!response.ok) {
          throw new Error('Erreur lors du chargement du job');
        }

        const job = await response.json();

        if (job.status !== 'COMPLETED' || !job.result?.article) {
          addToast({
            title: 'Job non disponible',
            description: "Ce job n'est pas terminé ou ne contient pas de résultat",
            variant: 'error',
          });
          setIsLoadingJob(false);
          return;
        }

        // Check if job has already been used to create an article
        if (job.usedAt && job.articleSlug) {
          addToast({
            title: 'Job déjà utilisé',
            description: `Ce job a déjà été utilisé pour créer un article. Redirection vers l'édition...`,
            variant: 'info',
          });
          router.push(`/admin/blog/edit/${job.articleSlug}`);
          return;
        }

        const article = job.result.article;

        // Generate slug from title and category
        const baseSlug = generateSlugFromTitleAndCategory(
          article.title || '',
          article.category || 'Comprendre'
        );

        // Check if slug already exists and get a unique one if needed
        let finalSlug = baseSlug;
        try {
          const checkResponse = await fetch(
            `/api/blog/posts/check-slug?slug=${encodeURIComponent(baseSlug)}`
          );
          if (checkResponse.ok) {
            const { exists, suggestedSlug } = await checkResponse.json();
            if (exists) {
              finalSlug = suggestedSlug;
              addToast({
                title: 'Slug modifié',
                description: `Un article avec le slug "${baseSlug}" existe déjà. Nouveau slug : "${finalSlug}"`,
                variant: 'info',
              });
            }
          }
        } catch (slugCheckError) {
          console.warn('Erreur vérification slug, utilisation du slug généré:', slugCheckError);
        }

        // Ensure FAQ items have unique IDs
        const faqWithIds = (article.faq || []).map(
          (item: { question: string; answer: string; id?: string }, index: number) => ({
            ...item,
            id: item.id || `faq-${Date.now()}-${index}`,
          })
        );

        // Update form with job data
        setFormData({
          title: article.title || '',
          slug: finalSlug,
          description: article.description || '',
          category: article.category || 'Comprendre',
          content: article.content || '',
          tags: article.tags || [],
          faq: faqWithIds,
          image: '',
          imagePrompt: article.imagePrompt || '',
          published: false,
          featured: false,
          date: new Date().toISOString().split('T')[0] ?? '',
          author: 'David Duquenne',
          seoIntent: '',
          persona: '',
          tones: [],
          jsonLd: undefined,
        });

        addToast({
          title: 'Article chargé',
          description: 'Les données du job ont été appliquées au formulaire',
          variant: 'success',
        });

        // Trigger automatic image generation if imagePrompt exists
        if (article.imagePrompt) {
          setTimeout(() => {
            addToast({
              title: "Génération de l'image...",
              description: "L'image va être générée automatiquement",
              variant: 'info',
            });
            generateImageFromArticleData({
              title: article.title || '',
              content: article.content || '',
              slug: finalSlug,
              category: article.category || 'Comprendre',
              tags: article.tags || [],
              imagePrompt: article.imagePrompt,
            });
          }, 500);
        }
      } catch (error) {
        console.error('Erreur chargement job:', error);
        addToast({
          title: 'Erreur',
          description: 'Impossible de charger les données du job',
          variant: 'error',
        });
      } finally {
        setIsLoadingJob(false);
      }
    };

    loadJobData();
  }, [jobId, setFormData, addToast, generateImageFromArticleData]);

  // Tab configuration
  const tabs = [
    {
      id: 'essentials',
      label: 'Essentiel',
      icon: FileText,
      children: (
        <EssentialsTab
          formData={formData}
          errors={errors}
          onFormDataChange={updateFormData}
          onClearError={clearError}
          onOpenGenerator={() => setIsGeneratorModalOpen(true)}
        />
      ),
    },
    {
      id: 'content',
      label: 'Contenu',
      icon: FileText,
      children: (
        <ContentTab
          content={formData.content}
          faqs={formData.faq}
          error={errors.content}
          onContentChange={content => updateFormData({ content })}
          onFAQChange={faq => updateFormData({ faq })}
          onImproveClick={() => setIsImproverOpen(true)}
          onImproveSelection={handleImproveSelection}
          onClearError={() => clearError('content')}
        />
      ),
    },
    {
      id: 'media',
      label: 'Média',
      icon: ImageIcon,
      children: (
        <MediaTab
          image={formData.image}
          imagePrompt={formData.imagePrompt}
          slug={formData.slug}
          title={formData.title}
          content={formData.content}
          isGeneratingPrompt={isGeneratingPrompt}
          isGeneratingImages={isGeneratingImages}
          isUploadingImage={isUploadingImage}
          isRegeneratingPrompt={isRegeneratingPrompt}
          imageProposals={imageProposals}
          onImageChange={image => updateFormData({ image })}
          onImagePromptChange={imagePrompt => updateFormData({ imagePrompt })}
          onGenerateImage={generateImage}
          onUploadImage={handleUploadImage}
          onSelectProposal={selectProposal}
          onRegenerateImages={regenerateImages}
          onRegeneratePrompt={regeneratePrompt}
        />
      ),
    },
    {
      id: 'advanced',
      label: 'Options',
      icon: Settings,
      children: (
        <AdvancedOptionsTab
          formData={formData}
          errors={errors}
          tagInput={tagInput}
          isEditing={isEditing}
          onFormDataChange={updateFormData}
          onTagInputChange={setTagInput}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onClearError={clearError}
        />
      ),
    },
  ];

  // Show loading state when loading job data
  if (isLoadingJob) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-gold h-8 w-8 animate-spin" />
          <p className="text-ivory/70">Chargement des données de l'article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/blog')}
            className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-gold text-sm uppercase tracking-[0.3em]">
              {isEditing ? 'Modifier' : 'Nouvel article'}
            </p>
            <h1 className="text-ivory mt-1 max-w-md truncate text-2xl font-semibold">
              {formData.title || 'Sans titre'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gold text-night hover:bg-gold/90 flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Form with Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Tabs items={tabs} defaultTab="essentials" onChange={setActiveTab} />
      </motion.div>

      {/* Social Diffusion Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <SocialDiffusionSection blogSlug={formData.slug} isNewPost={!isEditing} />
      </motion.div>

      {/* Action Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:justify-end"
      >
        <button
          onClick={() => router.push('/admin/blog')}
          className="border-gold/20 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-lg border px-6 py-3 font-medium transition"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gold text-night hover:bg-gold/90 flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-medium transition disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sauvegarde en cours...
            </>
          ) : formData.published ? (
            <>
              <Save className="h-5 w-5" />
              {isEditing ? 'Mettre à jour' : "Publier l'article"}
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Enregistrer le brouillon
            </>
          )}
        </button>
      </motion.div>

      {/* Modals */}
      <ModalContainer
        isGeneratorModalOpen={isGeneratorModalOpen}
        onCloseGeneratorModal={() => setIsGeneratorModalOpen(false)}
        onGenerateArticleData={handleGenerateArticleData}
        generatorInitialData={{
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          seoIntent: formData.seoIntent,
          persona: formData.persona,
          tones: formData.tones,
        }}
        isImproverOpen={isImproverOpen}
        onCloseImprover={() => setIsImproverOpen(false)}
        currentContent={formData.content}
        onImproveContent={handleImproveContent}
        isTextImproverOpen={isTextImproverOpen}
        onCloseTextImprover={() => setIsTextImproverOpen(false)}
        selectedTextToImprove={selectedTextToImprove}
        onImproveSelectedText={handleImproveSelectedText}
        isImageSelectionOpen={false}
        onCloseImageSelection={() => {}}
        onConfirmImageSelection={() => Promise.resolve()}
        onRegenerateImages={() => {}}
        imageProposals={[]}
        isRegenerating={false}
      />
    </div>
  );
}
