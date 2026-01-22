"use client";

import { Drawer, DrawerProps } from "../common/Drawer";
import { TestimonialForm, TestimonialFormProps, TestimonialFormData } from "./TestimonialForm";

export interface TestimonialDrawerProps extends Omit<DrawerProps, "children" | "footer"> {
  /** Initial form data */
  initialData?: Partial<TestimonialFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: TestimonialFormData) => Promise<void>;
  /** Whether form is loading */
  isLoading?: boolean;
  /** Form labels */
  formLabels?: TestimonialFormProps["labels"];
}

/**
 * TestimonialDrawer - Drawer wrapper for testimonial form
 */
export function TestimonialDrawer({
  initialData,
  onSubmit,
  isLoading,
  formLabels,
  ...drawerProps
}: TestimonialDrawerProps) {
  return (
    <Drawer {...drawerProps} width="md">
      <TestimonialForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={drawerProps.onClose}
        isLoading={isLoading}
        labels={formLabels}
      />
    </Drawer>
  );
}
