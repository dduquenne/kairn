"use client";

import { Drawer, DrawerProps } from "../common/Drawer";
import { SeminarForm, SeminarFormData } from "./SeminarForm";

export interface SeminarDrawerProps extends Omit<DrawerProps, "children" | "footer"> {
  /** Initial form data */
  initialData?: Partial<SeminarFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: SeminarFormData) => Promise<void>;
  /** Whether form is loading */
  isLoading?: boolean;
}

/**
 * SeminarDrawer - Drawer wrapper for seminar form
 */
export function SeminarDrawer({
  initialData,
  onSubmit,
  isLoading,
  ...drawerProps
}: SeminarDrawerProps) {
  return (
    <Drawer {...drawerProps} width="lg">
      <SeminarForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={drawerProps.onClose}
        isLoading={isLoading}
      />
    </Drawer>
  );
}
