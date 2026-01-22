"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "../../../components/ui/toast";
import { DeleteConfirmation } from "../_components/DeleteConfirmation";
import { SeminarDrawer } from "./_components/SeminarDrawer";
import { SeminarsSkeleton } from "./_components/SeminarsSkeleton";
import { SeminarsTable } from "./_components/SeminarsTable";
import { SeminarSocialModal } from "./_components/SeminarSocialModal";
import type { Seminar, SeminarFormValues } from "./types";

const emptySeminarValues: SeminarFormValues = {
  title: "",
  description: "",
  speakers: [
    { firstName: "", lastName: "" },
    { firstName: "", lastName: "" },
  ],
  startAt: "",
  endAt: "",
  capacity: 24,
  tags: [],
};

export default function SeminarsAdminPage() {
  const { addToast } = useToast();

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [currentSeminar, setCurrentSeminar] = useState<Seminar | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Seminar | null>(null);
  const [shareTarget, setShareTarget] = useState<Seminar | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadSeminars = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchSeminars();
      setSeminars(sortSeminars(data));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de charger les séminaires";
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
    void reloadSeminars();
  }, [reloadSeminars]);

  const seminarsList = useMemo(() => sortSeminars(seminars), [seminars]);
  const isLoadingData = isInitialLoading || isRefreshing;

  const drawerValues = useMemo<SeminarFormValues>(() => {
    if (drawerMode === "edit" && currentSeminar) {
      return {
        title: currentSeminar.title,
        description: currentSeminar.description,
        speakers: currentSeminar.speakers.map((speaker) => ({ ...speaker })),
        startAt: currentSeminar.startAt,
        endAt: currentSeminar.endAt,
        capacity: currentSeminar.capacity,
        price: currentSeminar.price,
        deposit: currentSeminar.deposit,
        order: currentSeminar.order,
        tags: currentSeminar.tags,
        thumbnail: currentSeminar.thumbnail,
        seminarType: currentSeminar.seminarType,
      };
    }
    return {
      ...emptySeminarValues,
      speakers: emptySeminarValues.speakers.map((speaker) => ({ ...speaker })),
    };
  }, [drawerMode, currentSeminar]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setCurrentSeminar(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(seminar: Seminar) {
    setDrawerMode("edit");
    setCurrentSeminar(seminar);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function confirmDelete(seminar: Seminar) {
    setDeleteTarget(seminar);
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

  async function handleCreate(values: SeminarFormValues) {
    setIsCreating(true);
    try {
      const created = await createSeminar(values);
      setSeminars((prev) => sortSeminars([...prev, created]));
      addToast({
        title: "Séminaire créé",
        description: "Le séminaire a été ajouté avec succès",
        variant: "success",
      });
      closeDrawer();
    } catch (error) {
      showErrorToast(
        "Impossible de créer le séminaire",
        error,
        "Erreur lors de la création du séminaire",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(id: string, values: SeminarFormValues) {
    setIsUpdating(true);
    try {
      const updated = await updateSeminar(id, values);
      setSeminars((prev) => sortSeminars(prev.map((seminar) => (seminar.id === id ? updated : seminar))));
      addToast({
        title: "Séminaire mis à jour",
        description: "Les informations ont été enregistrées",
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
      await deleteSeminar(id);
      setSeminars((prev) => sortSeminars(prev.filter((seminar) => seminar.id !== id)));
      addToast({
        title: "Séminaire supprimé",
        description: "Le séminaire a été retiré de la liste",
        variant: "success",
      });
      setDeleteTarget(null);
    } catch (error) {
      showErrorToast("Suppression impossible", error, "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSubmit(values: SeminarFormValues) {
    if (drawerMode === "edit" && currentSeminar) {
      void handleUpdate(currentSeminar.id, values);
    } else {
      void handleCreate(values);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ivory">Séminaires</h2>
          <p className="text-sm text-ivory/60">
            Gérez les dates, le contenu et les intervenants de vos prochains événements.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDrawer}
          className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-semibold text-night shadow transition hover:bg-gold/90"
        >
          + Créer
        </button>
      </div>

      {isLoadingData ? (
        <SeminarsSkeleton />
      ) : (
        <SeminarsTable
          seminars={seminarsList}
          onEdit={openEditDrawer}
          onDelete={confirmDelete}
          onShare={(seminar) => setShareTarget(seminar)}
        />
      )}

      <SeminarDrawer
        open={drawerOpen}
        mode={drawerMode}
        defaultValues={drawerValues}
        loading={isCreating || isUpdating}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        seminarId={currentSeminar?.id}
      />

      <DeleteConfirmation
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        description={
          deleteTarget
            ? `Êtes-vous sûr de vouloir supprimer « ${deleteTarget.title} » ? Cette action est irréversible.`
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

      {shareTarget && (
        <SeminarSocialModal
          seminar={shareTarget}
          open={Boolean(shareTarget)}
          onClose={() => setShareTarget(null)}
        />
      )}
    </section>
  );
}

async function fetchSeminars(): Promise<Seminar[]> {
  const response = await fetch("/api/seminars", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger les séminaires");
  }
  return response.json();
}

async function createSeminar(values: SeminarFormValues): Promise<Seminar> {
  const response = await fetch("/api/seminars", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Erreur lors de la création du séminaire");
  }

  return response.json();
}

async function updateSeminar(id: string, values: SeminarFormValues): Promise<Seminar> {
  const response = await fetch(`/api/seminars/${id}`, {
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

async function deleteSeminar(id: string): Promise<void> {
  const response = await fetch(`/api/seminars/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Erreur lors de la suppression");
  }
}

function sortSeminars(items: Seminar[]): Seminar[] {
  return [...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
}
