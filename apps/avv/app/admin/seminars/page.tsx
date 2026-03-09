'use client';

export const dynamic = 'force-dynamic';

import { SeminarsTable, SeminarDrawer } from '@kairn/admin';
import type { SeminarFormData, Seminar as AdminSeminar } from '@kairn/admin';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { siteConfig } from '@/config/site.config';
import { useToast } from '@/lib/toast-context';

import { DeleteConfirmation } from '../_components/DeleteConfirmation';

import { SeminarSocialModal } from './_components/SeminarSocialModal';
import { SeminarsSkeleton } from './_components/SeminarsSkeleton';
import type { Seminar, SeminarFormValues } from './types';

const SEMINARS_CONFIG = siteConfig.seminars;

/**
 * Admin page for managing seminars
 *
 * Uses shared @kairn/admin components (SeminarsTable, SeminarDrawer)
 * configured with avv-specific settings from site.config.ts.
 */
export default function SeminarsAdminPage() {
  const { addToast } = useToast();

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
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
        error instanceof Error ? error.message : 'Impossible de charger les séminaires';
      addToast({
        title: 'Erreur de chargement',
        description: message,
        variant: 'error',
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

  /** @internal Map Seminar to SeminarFormData for the shared form */
  const drawerInitialData = useMemo<Partial<SeminarFormData>>(() => {
    if (drawerMode === 'edit' && currentSeminar) {
      return {
        title: currentSeminar.title,
        description: currentSeminar.description,
        speakers: currentSeminar.speakers.map(speaker => ({ ...speaker })),
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
      speakers: Array.from({ length: SEMINARS_CONFIG?.speakersCount ?? 2 }, () => ({
        firstName: '',
        lastName: '',
      })),
      capacity: SEMINARS_CONFIG?.defaultCapacity ?? 24,
      tags: [],
    };
  }, [drawerMode, currentSeminar]);

  /** @internal */
  function openCreateDrawer() {
    setDrawerMode('create');
    setCurrentSeminar(null);
    setDrawerOpen(true);
  }

  /** @internal */
  function openEditDrawer(seminar: AdminSeminar) {
    setDrawerMode('edit');
    setCurrentSeminar(seminar as Seminar);
    setDrawerOpen(true);
  }

  /** @internal */
  function closeDrawer() {
    setDrawerOpen(false);
  }

  const showErrorToast = useCallback(
    (title: string, error: unknown, fallback: string) => {
      const message = error instanceof Error ? error.message : fallback;
      addToast({ title, description: message, variant: 'error' });
    },
    [addToast]
  );

  /** @internal */
  async function handleCreate(values: SeminarFormValues) {
    setIsCreating(true);
    try {
      const created = await createSeminar(values);
      setSeminars(prev => sortSeminars([...prev, created]));
      addToast({
        title: 'Séminaire créé',
        description: 'Le séminaire a été ajouté avec succès',
        variant: 'success',
      });
      closeDrawer();
    } catch (error) {
      showErrorToast(
        'Impossible de créer le séminaire',
        error,
        'Erreur lors de la création du séminaire'
      );
    } finally {
      setIsCreating(false);
    }
  }

  /** @internal */
  async function handleUpdate(id: string, values: SeminarFormValues) {
    setIsUpdating(true);
    try {
      const updated = await updateSeminar(id, values);
      setSeminars(prev =>
        sortSeminars(prev.map(seminar => (seminar.id === id ? updated : seminar)))
      );
      addToast({
        title: 'Séminaire mis à jour',
        description: 'Les informations ont été enregistrées',
        variant: 'success',
      });
      closeDrawer();
    } catch (error) {
      showErrorToast('Mise à jour impossible', error, 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  }

  /** @internal */
  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      await deleteSeminar(id);
      setSeminars(prev => sortSeminars(prev.filter(seminar => seminar.id !== id)));
      addToast({
        title: 'Séminaire supprimé',
        description: 'Le séminaire a été retiré de la liste',
        variant: 'success',
      });
      setDeleteTarget(null);
    } catch (error) {
      showErrorToast('Suppression impossible', error, 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }

  /** @internal Map SeminarFormData back to SeminarFormValues for API */
  function handleSubmit(data: SeminarFormData) {
    const values: SeminarFormValues = {
      title: data.title,
      description: data.description,
      speakers: data.speakers,
      startAt: data.startAt,
      endAt: data.endAt,
      capacity: data.capacity,
      price: data.price,
      deposit: data.deposit,
      order: data.order,
      tags: data.tags,
      thumbnail: data.thumbnail,
      seminarType: data.seminarType,
    };
    if (drawerMode === 'edit' && currentSeminar) {
      void handleUpdate(currentSeminar.id, values);
    } else {
      void handleCreate(values);
    }
  }

  /** @internal Handle thumbnail upload via API */
  async function handleThumbnailUpload(file: File, seminarId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier.'));
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const response = await fetch('/api/seminars/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seminarId, fileData, fileName: file.name }),
          });
          const data = await response.json();
          if (!response.ok) {
            reject(new Error(data.message || 'Erreur lors du téléchargement.'));
            return;
          }
          resolve(data.finalPath);
        } catch {
          reject(new Error("Erreur lors du téléchargement de l'image."));
        }
      };
      reader.readAsDataURL(file);
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-ivory text-2xl font-semibold">Séminaires</h2>
          <p className="text-ivory/60 text-sm">
            Gérez les dates, le contenu et les intervenants de vos prochains événements.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDrawer}
          className="bg-gold text-night hover:bg-gold/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow transition"
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
          onDelete={seminar => setDeleteTarget(seminar as Seminar)}
          onShare={seminar => setShareTarget(seminar as Seminar)}
        />
      )}

      <SeminarDrawer
        open={drawerOpen}
        mode={drawerMode}
        onClose={closeDrawer}
        initialData={drawerInitialData}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
        speakersCount={SEMINARS_CONFIG?.speakersCount ?? 2}
        seminarTypes={SEMINARS_CONFIG?.types ?? []}
        seminarId={currentSeminar?.id}
        onThumbnailUpload={SEMINARS_CONFIG?.thumbnailUpload ? handleThumbnailUpload : undefined}
        showDeposit={SEMINARS_CONFIG?.depositEnabled ?? false}
        showOrder={SEMINARS_CONFIG?.orderEnabled ?? false}
      />

      <DeleteConfirmation
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        description={
          deleteTarget
            ? `Êtes-vous sûr de vouloir supprimer « ${deleteTarget.title} » ? Cette action est irréversible.`
            : ''
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

/** @internal */
async function fetchSeminars(): Promise<Seminar[]> {
  const response = await fetch('/api/seminars', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Impossible de charger les séminaires');
  }
  return response.json();
}

/** @internal */
async function createSeminar(values: SeminarFormValues): Promise<Seminar> {
  const response = await fetch('/api/seminars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Erreur lors de la création du séminaire');
  }

  return response.json();
}

/** @internal */
async function updateSeminar(id: string, values: SeminarFormValues): Promise<Seminar> {
  const response = await fetch(`/api/seminars/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Erreur lors de la mise à jour');
  }

  return response.json();
}

/** @internal */
async function deleteSeminar(id: string): Promise<void> {
  const response = await fetch(`/api/seminars/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Erreur lors de la suppression');
  }
}

/** @internal */
function sortSeminars(items: Seminar[]): Seminar[] {
  return [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
