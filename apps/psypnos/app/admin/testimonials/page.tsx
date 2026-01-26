"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/lib/toast-context";
import { DeleteConfirmation } from "../_components/DeleteConfirmation";
import { TestimonialDrawer } from "./_components/TestimonialDrawer";
import { TestimonialsSkeleton } from "./_components/TestimonialsSkeleton";
import { TestimonialsTable } from "./_components/TestimonialsTable";
import type { Testimonial, TestimonialFormValues } from "./types";

const emptyTestimonialValues: TestimonialFormValues = {
  quote: "",
  author: "",
  role: "",
};

export default function TestimonialsAdminPage() {
  const { addToast } = useToast();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadTestimonials = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchTestimonials();
      setTestimonials(sortTestimonials(data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de charger les témoignages";
      addToast({
        title: "Erreur de chargement",
        description: message,
        variant: "error",
      });
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    void reloadTestimonials();
  }, [reloadTestimonials]);

  const testimonialsList = useMemo(() => sortTestimonials(testimonials), [testimonials]);
  const isLoadingData = isInitialLoading || isRefreshing;

  const drawerValues = useMemo<TestimonialFormValues>(() => {
    if (drawerMode === "edit" && currentTestimonial) {
      return {
        quote: currentTestimonial.quote,
        author: currentTestimonial.author,
        role: currentTestimonial.role ?? "",
      };
    }
    return { ...emptyTestimonialValues };
  }, [drawerMode, currentTestimonial]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setCurrentTestimonial(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(testimonial: Testimonial) {
    setDrawerMode("edit");
    setCurrentTestimonial(testimonial);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function confirmDelete(testimonial: Testimonial) {
    setDeleteTarget(testimonial);
  }

  const showErrorToast = useCallback(
    (title: string, error: unknown, fallback: string) => {
      const message = error instanceof Error ? error.message : fallback;
      addToast({
        title,
        description: message,
        variant: "error",
      });
    },
    [addToast],
  );

  async function handleCreate(values: TestimonialFormValues) {
    setIsCreating(true);
    try {
      const created = await createTestimonial(values);
      setTestimonials((prev) => sortTestimonials([...prev, created]));
      addToast({
        title: "Témoignage ajouté",
        description: "Le témoignage est désormais visible sur la page d'accueil",
        variant: "success",
      });
      closeDrawer();
    } catch (error) {
      showErrorToast(
        "Impossible de créer le témoignage",
        error,
        "Erreur lors de la création du témoignage",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(id: string, values: TestimonialFormValues) {
    setIsUpdating(true);
    try {
      const updated = await updateTestimonial(id, values);
      setTestimonials((prev) =>
        sortTestimonials(prev.map((testimonial) => (testimonial.id === id ? updated : testimonial))),
      );
      addToast({
        title: "Témoignage mis à jour",
        description: "Les modifications ont été enregistrées",
        variant: "success",
      });
      closeDrawer();
    } catch (error) {
      showErrorToast("Mise à jour impossible", error, "Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      await deleteTestimonial(id);
      setTestimonials((prev) => sortTestimonials(prev.filter((testimonial) => testimonial.id !== id)));
      addToast({
        title: "Témoignage supprimé",
        description: "Le témoignage a été retiré de la liste",
        variant: "success",
      });
      setDeleteTarget(null);
    } catch (error) {
      showErrorToast("Suppression impossible", error, "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSubmit(values: TestimonialFormValues) {
    if (drawerMode === "edit" && currentTestimonial) {
      void handleUpdate(currentTestimonial.id, values);
    } else {
      void handleCreate(values);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ivory">Témoignages</h2>
          <p className="text-sm text-ivory/60">
            Gérez les retours clients affichés sur la page d'accueil.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDrawer}
          className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-semibold text-night shadow transition hover:bg-gold/90"
        >
          + Ajouter
        </button>
      </div>

      {isLoadingData ? (
        <TestimonialsSkeleton />
      ) : (
        <TestimonialsTable
          testimonials={testimonialsList}
          onEdit={openEditDrawer}
          onDelete={confirmDelete}
        />
      )}

      <TestimonialDrawer
        open={drawerOpen}
        mode={drawerMode}
        defaultValues={drawerValues}
        loading={isCreating || isUpdating}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmation
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        description={
          deleteTarget
            ? `Êtes-vous sûr de vouloir supprimer le témoignage de « ${deleteTarget.author} » ? Cette action est irréversible.`
            : ""
        }
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget.id);
          }
        }}
      />
    </section>
  );
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  const response = await fetch("/api/testimonials", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger les témoignages");
  }
  return response.json();
}

async function createTestimonial(values: TestimonialFormValues): Promise<Testimonial> {
  const response = await fetch("/api/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Erreur lors de la création du témoignage");
  }

  return response.json();
}

async function updateTestimonial(id: string, values: TestimonialFormValues): Promise<Testimonial> {
  const response = await fetch(`/api/testimonials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Erreur lors de la mise à jour");
  }

  return response.json();
}

async function deleteTestimonial(id: string): Promise<void> {
  const response = await fetch(`/api/testimonials/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Erreur lors de la suppression");
  }
}

function sortTestimonials(items: Testimonial[]): Testimonial[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
