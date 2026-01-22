"use client";

import { Drawer, DrawerProps } from "../common/Drawer";
import { BlogPostForm, BlogPostFormProps, BlogPostFormData } from "./BlogPostForm";

export interface BlogPostDrawerProps
  extends Omit<DrawerProps, "children" | "footer"> {
  /** Initial form data */
  initialData?: Partial<BlogPostFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Form labels */
  formLabels?: BlogPostFormProps["labels"];
  /** Custom tabs */
  customTabs?: BlogPostFormProps["customTabs"];
}

/**
 * BlogPostDrawer - Drawer wrapper for blog post form
 *
 * @example
 * ```tsx
 * <BlogPostDrawer
 *   open={showDrawer}
 *   onClose={() => setShowDrawer(false)}
 *   title="Create Post"
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function BlogPostDrawer({
  initialData,
  onSubmit,
  isLoading,
  formLabels,
  customTabs,
  ...drawerProps
}: BlogPostDrawerProps) {
  return (
    <Drawer {...drawerProps} width="xl">
      <BlogPostForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={drawerProps.onClose}
        isLoading={isLoading}
        labels={formLabels}
        customTabs={customTabs}
      />
    </Drawer>
  );
}
