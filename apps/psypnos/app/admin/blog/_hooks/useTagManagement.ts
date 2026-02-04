import { useState, useCallback } from "react";

import { FormData } from "./useFormData";

/**
 * Custom hook for managing tags in the blog post form
 *
 * Handles tag input state and provides functions to add/remove tags.
 * Prevents duplicate tags and manages the tag input field.
 *
 * @param formData - Current form data containing the tags array
 * @param updateFormData - Function to partially update the form data
 * @returns Object containing tag management state and methods
 *
 * @example
 * ```tsx
 * const { tagInput, setTagInput, handleAddTag, handleRemoveTag } = useTagManagement(formData, updateFormData);
 *
 * // In your input's onKeyPress
 * if (e.key === "Enter") {
 *   handleAddTag();
 * }
 * ```
 */
export function useTagManagement(
  formData: FormData,
  updateFormData: (update: Partial<FormData>) => void
) {
  const [tagInput, setTagInput] = useState("");

  /**
   * Adds a new tag to the form data if it's not empty and not a duplicate
   * Clears the tag input field after adding
   */
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      updateFormData({ tags: [...formData.tags, tag] });
      setTagInput("");
    }
  }, [tagInput, formData.tags, updateFormData]);

  /**
   * Removes a tag at the specified index from the form data
   * @param index - The index of the tag to remove
   */
  const handleRemoveTag = useCallback((index: number) => {
    updateFormData({ tags: formData.tags.filter((_, i) => i !== index) });
  }, [formData.tags, updateFormData]);

  return {
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
  };
}
