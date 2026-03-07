'use client';

import { Drawer } from '../common/Drawer';

import { SeminarForm } from './SeminarForm';
import type { SeminarFormData, SeminarFormProps } from './SeminarForm';

/**
 * Props for the SeminarDrawer component
 */
export interface SeminarDrawerProps extends Pick<
  SeminarFormProps,
  | 'initialData'
  | 'onSubmit'
  | 'isLoading'
  | 'speakersCount'
  | 'seminarTypes'
  | 'seminarId'
  | 'onThumbnailUpload'
  | 'showDeposit'
  | 'showOrder'
  | 'renderThumbnail'
> {
  /** Whether the drawer is open */
  open: boolean;
  /** Mode: create or edit */
  mode: 'create' | 'edit';
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Custom drawer class name */
  className?: string;
}

const HEADINGS = {
  create: { title: 'Créer un séminaire', submitLabel: 'Créer' },
  edit: { title: 'Modifier le séminaire', submitLabel: 'Mettre à jour' },
} as const;

/**
 * SeminarDrawer - Drawer wrapper for the seminar form
 *
 * Uses the shared Drawer component and passes all SeminarForm config through.
 */
export function SeminarDrawer({
  open,
  mode,
  onClose,
  className,
  initialData,
  onSubmit,
  isLoading,
  speakersCount,
  seminarTypes,
  seminarId,
  onThumbnailUpload,
  showDeposit,
  showOrder,
  renderThumbnail,
}: SeminarDrawerProps) {
  const { title, submitLabel } = HEADINGS[mode];

  return (
    <Drawer open={open} onClose={onClose} width="lg" className={className}>
      <SeminarForm
        initialData={initialData}
        heading={title}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        speakersCount={speakersCount}
        seminarTypes={seminarTypes}
        seminarId={seminarId}
        onThumbnailUpload={onThumbnailUpload}
        showDeposit={showDeposit}
        showOrder={showOrder}
        renderThumbnail={renderThumbnail}
      />
    </Drawer>
  );
}

export type { SeminarFormData };
