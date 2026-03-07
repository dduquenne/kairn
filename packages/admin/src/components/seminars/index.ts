/**
 * Seminars Admin Components
 *
 * Configurable components for managing seminars/events in admin dashboards.
 * Supports both simple and enriched seminar models.
 */

export { SeminarsTable } from './SeminarsTable';
export { SeminarForm } from './SeminarForm';
export { SeminarDrawer } from './SeminarDrawer';
export { ParticipantsList } from './ParticipantsList';

// Types
export type { SeminarsTableProps, Seminar, SeminarSpeaker } from './SeminarsTable';
export type { SeminarFormProps, SeminarFormData, SeminarTypeOption } from './SeminarForm';
export type { SeminarDrawerProps } from './SeminarDrawer';
export type { ParticipantsListProps, Participant } from './ParticipantsList';
