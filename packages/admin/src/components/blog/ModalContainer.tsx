'use client';

/**
 * Modal Container
 *
 * Consolidates all modals used in the blog post form.
 */

import type { FAQItem } from '@kairn/blog';

import { ArticleGeneratorModal } from './ArticleGeneratorModal';
import { ArticleImprover } from './ArticleImprover';
import { ImageSelectionModal, type ImageProposal } from './ImageSelectionModal';
import { TextImprover } from './TextImprover';

interface ModalContainerProps {
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

  isImproverOpen: boolean;
  onCloseImprover: () => void;
  currentContent: string;
  onImproveContent: (improvedContent: string) => void;

  isTextImproverOpen: boolean;
  onCloseTextImprover: () => void;
  selectedTextToImprove: string;
  onImproveSelectedText: (improvedText: string) => void;

  isImageSelectionOpen: boolean;
  onCloseImageSelection: () => void;
  onConfirmImageSelection: (proposal: ImageProposal) => Promise<void>;
  onRegenerateImages: () => void;
  imageProposals: ImageProposal[];
  isRegenerating: boolean;
}

/**
 * Container consolidant tous les modaux du formulaire blog
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
      <ArticleGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={onCloseGeneratorModal}
        onGenerateData={onGenerateArticleData}
        initialData={generatorInitialData}
      />

      <ArticleImprover
        isOpen={isImproverOpen}
        onClose={onCloseImprover}
        currentContent={currentContent}
        onImprove={onImproveContent}
      />

      <TextImprover
        isOpen={isTextImproverOpen}
        onClose={onCloseTextImprover}
        selectedText={selectedTextToImprove}
        onImprove={onImproveSelectedText}
      />

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
