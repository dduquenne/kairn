"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/lib/toast-context";
import { DeleteConfirmation } from "../_components/DeleteConfirmation";
import { UserDrawer } from "./_components/UserDrawer";
import { UsersSkeleton } from "./_components/UsersSkeleton";
import { UsersTable } from "./_components/UsersTable";
import type { AdminUser, AdminUserFormValues, AdminUserUpdateValues } from "./types";

const emptyFormValues: AdminUserFormValues = {
  email: "",
  password: "",
};

export default function AdminUsersPage() {
  const { addToast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        a.email.localeCompare(b.email, "fr", { sensitivity: "base" }),
      ),
    [users],
  );

  const isLoadingData = isInitialLoading || isRefreshing;

  const drawerValues = useMemo<AdminUserFormValues>(() => {
    if (drawerMode === "edit" && currentUser) {
      return {
        email: currentUser.email,
        password: "",
      };
    }

    return { ...emptyFormValues };
  }, [drawerMode, currentUser]);

  const loadUsers = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de charger les utilisateurs";
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
    void loadUsers();
  }, [loadUsers]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setCurrentUser(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(user: AdminUser) {
    setDrawerMode("edit");
    setCurrentUser(user);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function confirmDelete(user: AdminUser) {
    setDeleteTarget(user);
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

  async function handleCreate(values: AdminUserFormValues) {
    setIsCreating(true);
    try {
      const created = await createAdminUser(values);
      setUsers((prev) => [...prev, created]);
      addToast({
        title: "Utilisateur créé",
        description: "Les accès administrateur ont été générés",
        variant: "success",
      });
      closeDrawer();
    } catch (error) {
      showErrorToast(
        "Création impossible",
        error,
        "Erreur lors de la création de l'utilisateur",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(id: string, values: AdminUserUpdateValues) {
    setIsUpdating(true);
    try {
      const updated = await updateAdminUser(id, values);
      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
      addToast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été enregistrées",
        variant: "success",
      });
      closeDrawer();
    } catch (error) {
      showErrorToast(
        "Mise à jour impossible",
        error,
        "Erreur lors de la mise à jour de l'utilisateur",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      addToast({
        title: "Utilisateur supprimé",
        description: "L'accès administrateur a été révoqué",
        variant: "success",
      });
      setDeleteTarget(null);
    } catch (error) {
      showErrorToast(
        "Suppression impossible",
        error,
        "Erreur lors de la suppression de l'utilisateur",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleResetPassword(user: AdminUser) {
    setResettingUserId(user.id);
    try {
      const result = await resetAdminPassword(user.id);
      setUsers((prev) => prev.map((item) => (item.id === user.id ? result.user : item)));
      addToast({
        title: "Mot de passe réinitialisé",
        description: `Nouveau mot de passe : ${result.temporaryPassword}`,
        variant: "success",
      });
    } catch (error) {
      showErrorToast(
        "Réinitialisation impossible",
        error,
        "Erreur lors de la réinitialisation du mot de passe",
      );
    } finally {
      setResettingUserId(null);
    }
  }

  function handleSubmit(values: AdminUserFormValues | AdminUserUpdateValues) {
    if (drawerMode === "edit" && currentUser) {
      void handleUpdate(currentUser.id, values as AdminUserUpdateValues);
    } else {
      void handleCreate(values as AdminUserFormValues);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ivory">Utilisateurs admin</h2>
          <p className="text-sm text-ivory/60">
            Gérez les accès au tableau de bord et générez des mots de passe temporaires.
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
        <UsersSkeleton />
      ) : (
        <UsersTable
          users={sortedUsers}
          onEdit={openEditDrawer}
          onDelete={confirmDelete}
          onResetPassword={handleResetPassword}
        />
      )}

      <UserDrawer
        open={drawerOpen}
        mode={drawerMode}
        initialValues={drawerValues}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        submitting={drawerMode === "create" ? isCreating : isUpdating}
      />

      <DeleteConfirmation
        open={Boolean(deleteTarget)}
        title="Supprimer l'utilisateur"
        description="Cette action retire l'accès administrateur."
        confirmLabel="Supprimer"
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDelete(deleteTarget.id)}
      />

      {resettingUserId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border border-gold/40 bg-night/90 px-6 py-4 text-sm text-ivory">
            Réinitialisation en cours...
          </div>
        </div>
      ) : null}
    </section>
  );
}

async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch("/api/admin/users", { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Impossible de récupérer les utilisateurs");
  }
  return (await response.json()) as AdminUser[];
}

async function createAdminUser(values: AdminUserFormValues): Promise<AdminUser> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Impossible de créer l'utilisateur");
  }

  return (await response.json()) as AdminUser;
}

async function updateAdminUser(id: string, values: AdminUserUpdateValues): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Impossible de mettre à jour l'utilisateur");
  }

  return (await response.json()) as AdminUser;
}

async function deleteAdminUser(id: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Impossible de supprimer l'utilisateur");
  }
}

async function resetAdminPassword(id: string): Promise<{ user: AdminUser; temporaryPassword: string }> {
  const response = await fetch(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Impossible de réinitialiser le mot de passe");
  }

  const payload = (await response.json()) as { user: AdminUser; temporaryPassword: string };
  return payload;
}
