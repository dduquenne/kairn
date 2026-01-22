import { useCallback, useState } from "react";
import { useToast } from "../../../../components/ui/toast";
import { FormData } from "./useFormData";

/**
 * Custom hook for managing text improvement features
 *
 * Handles three types of text improvements:
 * - Full content improvement (entire article)
 * - Selection improvement (selected text from editor)
 * - Modal state management for improvers
 *
 * @example
 * ```tsx
 * const {
 *   isImproverOpen,
 *   setIsImproverOpen,
 *   handleImproveContent,
 *   handleImproveSelection,
 * } = useTextImprovement(formData, updateFormData);
 *
 * // Improve entire content
 * <button onClick={() => setIsImproverOpen(true)}>
 *   Improve Article
 * </button>
 *
 * // Improve selected text
 * <Editor onImproveSelection={handleImproveSelection} />
 * ```
 *
 * @param formData - The current form data
 * @param updateFormData - Callback to update the form data
 * @returns Object containing states and handlers for text improvement
 */
export function useTextImprovement(
  formData: FormData,
  updateFormData: (update: Partial<FormData>) => void
) {
  const { addToast } = useToast();

  // State for article improver modal
  const [isImproverOpen, setIsImproverOpen] = useState(false);

  // State for text improver modal (for selected text)
  const [isTextImproverOpen, setIsTextImproverOpen] = useState(false);

  // Store the selected text to be improved
  const [selectedTextToImprove, setSelectedTextToImprove] = useState("");

  /**
   * Handle improvement of the entire article content
   *
   * @param improvedContent - The improved version of the content
   */
  const handleImproveContent = useCallback((improvedContent: string) => {
    updateFormData({ content: improvedContent });
    addToast({
      title: "Article amélioré avec succès",
      variant: "success",
    });
  }, [updateFormData, addToast]);

  /**
   * Handle selection of text to improve
   * Opens the text improver modal with the selected text
   *
   * @param selectedText - The text selected by the user
   */
  const handleImproveSelection = useCallback((selectedText: string) => {
    setSelectedTextToImprove(selectedText);
    setIsTextImproverOpen(true);
  }, []);

  /**
   * Handle improvement of selected text
   * Replaces the selected text with the improved version in the content
   *
   * @param improvedText - The improved version of the selected text
   */
  const handleImproveSelectedText = useCallback((improvedText: string) => {
    // Replace the selected text with the improved text in the content
    const newContent = formData.content.replace(selectedTextToImprove, improvedText);
    updateFormData({ content: newContent });

    addToast({
      title: "Texte amélioré avec succès",
      variant: "success",
    });

    // Clear the selected text
    setSelectedTextToImprove("");
  }, [formData.content, selectedTextToImprove, updateFormData, addToast]);

  return {
    // Article improver modal state
    isImproverOpen,
    setIsImproverOpen,

    // Text improver modal state
    isTextImproverOpen,
    setIsTextImproverOpen,

    // Selected text state
    selectedTextToImprove,
    setSelectedTextToImprove,

    // Handlers
    handleImproveContent,
    handleImproveSelection,
    handleImproveSelectedText,
  };
}
