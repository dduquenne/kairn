/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
export const SEMINAR_TYPES = [
  { value: "respiration-holotropique", label: "Respiration holotropique" },
  { value: "breathwork", label: "Breathwork" },
  { value: "rebirth", label: "Rebirth" },
  { value: "meditation", label: "Méditation" },
  { value: "yoga", label: "Yoga" },
  { value: "developpement-personnel", label: "Développement personnel" },
  { value: "autre", label: "Autre" },
] as const;

export type SeminarType = (typeof SEMINAR_TYPES)[number]["value"];

export type SeminarBase = {
  id: string;
  title: string;
  description: string;
  speakers: Array<{ firstName: string; lastName: string }>;
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  order?: string;
  tags: string[];
  thumbnail?: string;
  seminarType?: string;
  createdAt: string;
  updatedAt: string;
};
