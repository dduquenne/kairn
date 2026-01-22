"use client";

import { useEffect } from "react";

import type { TestimonialFormValues } from "../types";
import { TestimonialForm } from "./TestimonialForm";

const headings = {
  create: {
    title: "Ajouter un témoignage",
    submitLabel: "Ajouter",
  },
  edit: {
    title: "Modifier le témoignage",
    submitLabel: "Mettre à jour",
  },
} as const;

type TestimonialDrawerProps = {
  open: boolean;
  mode: keyof typeof headings;
  defaultValues: TestimonialFormValues;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: TestimonialFormValues) => void | Promise<void>;
};

export function TestimonialDrawer({
  open,
  mode,
  defaultValues,
  loading,
  onClose,
  onSubmit,
}: TestimonialDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  if (!open) {
    return null;
  }

  const { title, submitLabel } = headings[mode];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        aria-label="Fermer le panneau"
        tabIndex={-1}
      />
      <aside className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-night px-6 py-8 shadow-aurora">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xl text-ivory/60 transition hover:text-ivory"
          aria-label="Fermer"
        >
          ×
        </button>
        <TestimonialForm
          defaultValues={defaultValues}
          heading={title}
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </aside>
    </div>
  );
}
