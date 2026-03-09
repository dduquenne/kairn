/**
 * @module ModalContainer
 * @description Container component that consolidates all modals used in the blog post form
 *
 * This component centralizes modal management for better code organization:
 * - **ArticleGeneratorModal**: AI-powered article generation from prompts
 * - **ArticleImprover**: Improve entire article content with AI
 * - **TextImprover**: Improve selected text snippets
 * - **ImageSelectionModal**: Select from DALL-E generated image proposals
 *
 * **Design Pattern:**
 * By consolidating modals in a single container:
 * - Keeps BlogPostForm component cleaner and more focused
 * - Centralizes modal prop management
 * - Makes it easier to add new modals
 * - Improves code maintainability
 *
 * **Modal Coordination:**
 * Each modal is independent but shares common patterns:
 * - isOpen prop controls visibility
 * - onClose callback handles closing
 * - Specific callbacks handle data/actions (onGenerate, onImprove, etc.)
 * - Loading states managed by parent hooks
 *
 * @see {@link /app/admin/blog/_components/BlogPostForm.tsx} - Parent component
 * @see {@link /app/admin/blog/_components/ArticleGeneratorModal.tsx} - Article generation modal
 * @see {@link /app/admin/blog/_components/ArticleImprover.tsx} - Content improvement modal
 * @see {@link /app/admin/blog/_components/TextImprover.tsx} - Text snippet improvement modal
 * @see {@link /app/admin/blog/_components/ImageSelectionModal.tsx} - Image selection modal
 *
 * @component
 * @example
 * ```tsx
 * <ModalContainer
 *   isGeneratorModalOpen={isOpen}
 *   onCloseGeneratorModal={() => setIsOpen(false)}
 *   onGenerateArticleData={handleData}
 *   // ... other modal props
 * />
 * ```
 */

"use client";

import type { FAQItem } from "@/lib/blog";

import { ArticleGeneratorModal } from "./ArticleGeneratorModal";
import { ArticleImprover } from "./ArticleImprover";
import { ImageSelectionModal, type ImageProposal } from "./ImageSelectionModal";
import { TextImprover } from "./TextImprover";

/**
 * Props for ModalContainer component
 *
 * Organized by modal type for clarity. Each modal has:
 * - Visibility state (isXxxOpen)
 * - Close handler (onCloseXxx)
 * - Data/action handlers (onGenerateXxx, onImproveXxx, etc.)
 * - Optional loading/data states
 */
interface ModalContainerProps {
  // Article Generator Modal
  isGeneratorModalOpen: boolean;
  onCloseGeneratorModal: () => void;
  onGenerateArticleData: (article: {
    title: string;
    description: string;
    category: string;
    content: string;
    tags: string[];
    faq: FAQItem[];
    imagePrompt?: string;
    seoIntent?: string;
    persona?: string;
    tones?: string[];
  }) => void;
  generatorInitialData: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    seoIntent?: string;
    persona?: string;
    tones?: string[];
  };

  // Article Improver Modal
  isImproverOpen: boolean;
  onCloseImprover: () => void;
  currentContent: string;
  onImproveContent: (improvedContent: string) => void;

  // Text Improver Modal
  isTextImproverOpen: boolean;
  onCloseTextImprover: () => void;
  selectedTextToImprove: string;
  onImproveSelectedText: (improvedText: string) => void;

  // Image Selection Modal
  isImageSelectionOpen: boolean;
  onCloseImageSelection: () => void;
  onConfirmImageSelection: (proposal: ImageProposal) => void;
  onRegenerateImages: () => void;
  imageProposals: ImageProposal[];
  isRegenerating: boolean;
}

/**
 * ModalContainer Component
 *
 * Consolidates all modals used in the blog post form:
 * - **ArticleGeneratorModal**: For AI-powered article generation from user prompts
 * - **ArticleImprover**: For improving entire article content with AI suggestions
 * - **TextImprover**: For improving selected text snippets inline
 * - **ImageSelectionModal**: For selecting from DALL-E generated image proposals
 *
 * **Benefits of Consolidation:**
 * - Cleaner parent component (BlogPostForm)
 * - Centralized modal prop management
 * - Easier to add/remove modals
 * - Better code organization and maintainability
 *
 * **Usage Pattern:**
 * This component doesn't manage state itself - it receives all props
 * from the parent and passes them through to individual modals.
 * State management happens in BlogPostForm via custom hooks.
 *
 * @param {ModalContainerProps} props - All modal props consolidated
 * @returns {JSX.Element} Fragment containing all modal components
 */
export function ModalContainer({
  isGeneratorModalOpen,
  onCloseGeneratorModal,
  onGenerateArticleData,
  generatorInitialData,
  isImproverOpen,
  onCloseImprover,
  currentContent,
  onImproveContent,
  isTextImproverOpen,
  onCloseTextImprover,
  selectedTextToImprove,
  onImproveSelectedText,
  isImageSelectionOpen,
  onCloseImageSelection,
  onConfirmImageSelection,
  onRegenerateImages,
  imageProposals,
  isRegenerating,
}: ModalContainerProps) {
  return (
    <>
      {/* Article Generator Modal: AI-powered article generation from scratch */}
      <ArticleGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={onCloseGeneratorModal}
        onGenerateData={onGenerateArticleData}
        initialData={generatorInitialData}
      />

      {/* Article Improver Modal: Improve entire article content with AI */}
      <ArticleImprover
        isOpen={isImproverOpen}
        onClose={onCloseImprover}
        currentContent={currentContent}
        onImprove={onImproveContent}
      />

      {/* Text Improver Modal: Improve selected text snippets inline */}
      <TextImprover
        isOpen={isTextImproverOpen}
        onClose={onCloseTextImprover}
        selectedText={selectedTextToImprove}
        onImprove={onImproveSelectedText}
      />

      {/* Image Selection Modal: Preview and select from DALL-E generated images */}
      <ImageSelectionModal
        isOpen={isImageSelectionOpen}
        onClose={onCloseImageSelection}
        onConfirmSelection={onConfirmImageSelection}
        onRegenerate={onRegenerateImages}
        proposals={imageProposals}
        isRegenerating={isRegenerating}
      />
    </>
  );
}
