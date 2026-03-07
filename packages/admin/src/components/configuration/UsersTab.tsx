'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2,
  Trash2,
  Key,
  Mail,
  Shield,
  UserPlus,
  Users as UsersIcon,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  X,
  Lock,
  RefreshCw,
  User,
} from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';

import type { ToastHandler, AdminUser } from './types';

/** Props du composant UsersTab */
export interface UsersTabProps {
  users: AdminUser[];
  onRefresh: () => void;
  toast: ToastHandler;
}

/**
 * Onglet de gestion des utilisateurs administrateurs.
 * Permet la création, modification, suppression et réinitialisation de mots de passe.
 */
export function UsersTab({ users, onRefresh, toast }: UsersTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'password'>('create');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const sortedUsers = [...users].sort((a, b) =>
    a.email.localeCompare(b.email, 'fr', { sensitivity: 'base' })
  );

  /** Ouvre le tiroir en mode création */
  const openCreateDrawer = () => {
    setDrawerMode('create');
    setCurrentUser(null);
    setGeneratedPassword(null);
    setDrawerOpen(true);
  };

  /** Ouvre le tiroir en mode édition */
  const openEditDrawer = (user: AdminUser) => {
    setDrawerMode('edit');
    setCurrentUser(user);
    setGeneratedPassword(null);
    setDrawerOpen(true);
  };

  /** Ouvre le tiroir en mode changement de mot de passe */
  const openPasswordDrawer = (user: AdminUser) => {
    setDrawerMode('password');
    setCurrentUser(user);
    setGeneratedPassword(null);
    setDrawerOpen(true);
  };

  /** Ferme le tiroir */
  const closeDrawer = () => {
    setDrawerOpen(false);
    setGeneratedPassword(null);
  };

  /** Crée un nouvel utilisateur */
  const handleCreate = async (values: { email: string; password: string }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Impossible de créer l'utilisateur");
      }

      toast.addToast({
        title: 'Utilisateur créé',
        description: 'Les accès administrateur ont été générés',
        variant: 'success',
      });
      closeDrawer();
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création';
      toast.addToast({
        title: 'Erreur',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Met à jour les informations d'un utilisateur */
  const handleUpdate = async (id: string, values: { email: string }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Impossible de mettre à jour l'utilisateur");
      }

      toast.addToast({
        title: 'Utilisateur mis à jour',
        description: 'Les informations ont été enregistrées',
        variant: 'success',
      });
      closeDrawer();
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      toast.addToast({
        title: 'Erreur',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Change le mot de passe d'un utilisateur */
  const handleChangePassword = async (
    id: string,
    values: { currentPassword?: string; newPassword: string }
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Impossible de changer le mot de passe');
      }

      toast.addToast({
        title: 'Mot de passe modifié',
        description: 'Le nouveau mot de passe a été enregistré',
        variant: 'success',
      });
      closeDrawer();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du changement';
      toast.addToast({
        title: 'Erreur',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Réinitialise le mot de passe avec un mot de passe temporaire généré */
  const handleResetPassword = async (user: AdminUser) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Impossible de réinitialiser le mot de passe');
      }

      const payload = await response.json();
      setGeneratedPassword(payload.temporaryPassword);
      setCurrentUser(user);
      setDrawerMode('password');
      setDrawerOpen(true);

      toast.addToast({
        title: 'Mot de passe réinitialisé',
        description: 'Un nouveau mot de passe temporaire a été généré',
        variant: 'success',
      });
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
      toast.addToast({
        title: 'Erreur',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Supprime un utilisateur */
  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Impossible de supprimer l'utilisateur");
      }

      toast.addToast({
        title: 'Utilisateur supprimé',
        description: "L'accès administrateur a été révoqué",
        variant: 'success',
      });
      setDeleteTarget(null);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      toast.addToast({
        title: 'Erreur',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Formate une date en format français court */
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-ivory text-xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-ivory/60 text-sm">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} administrateur
            {users.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={openCreateDrawer}
          className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-600"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <UsersIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{users.length}</p>
              <p className="text-ivory/50 text-xs">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{users.length}</p>
              <p className="text-ivory/50 text-xs">Administrateurs</p>
            </div>
          </div>
        </div>
        <div className="hidden rounded-xl border border-green-500/20 bg-green-500/5 p-4 sm:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{users.length}</p>
              <p className="text-ivory/50 text-xs">Actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-ivory/20 bg-night/40 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
            <UsersIcon className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-ivory mt-4 text-lg font-medium">Aucun utilisateur</h3>
          <p className="text-ivory/60 mt-2 text-sm">Créez le premier utilisateur administrateur</p>
          <button
            onClick={openCreateDrawer}
            className="mt-6 flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-purple-600"
          >
            <UserPlus className="h-4 w-4" />
            Créer un utilisateur
          </button>
        </motion.div>
      ) : (
        <div className="border-ivory/10 bg-night/40 overflow-hidden rounded-2xl border">
          <table className="divide-ivory/10 min-w-full divide-y">
            <thead className="bg-night/60">
              <tr>
                <th
                  scope="col"
                  className="text-gold px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Utilisateur
                </th>
                <th
                  scope="col"
                  className="text-gold hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider sm:table-cell"
                >
                  Créé le
                </th>
                <th
                  scope="col"
                  className="text-gold hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider md:table-cell"
                >
                  Mis à jour
                </th>
                <th
                  scope="col"
                  className="text-gold px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-ivory/10 divide-y">
              {sortedUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-ivory/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                        <User className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-ivory font-medium">{user.email}</p>
                        <p className="text-ivory/50 flex items-center gap-1 text-xs">
                          <Shield className="h-3 w-3" />
                          Administrateur
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-ivory/60 hidden px-6 py-4 text-sm sm:table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="text-ivory/60 hidden px-6 py-4 text-sm md:table-cell">
                    {formatDate(user.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Réinitialiser</span>
                      </button>
                      <button
                        onClick={() => openPasswordDrawer(user)}
                        className="border-ivory/10 text-ivory/60 hover:bg-ivory/5 hover:text-ivory flex h-9 w-9 items-center justify-center rounded-lg border transition"
                        title="Changer le mot de passe"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditDrawer(user)}
                        className="border-ivory/10 text-ivory/60 hover:bg-ivory/5 hover:text-ivory flex h-9 w-9 items-center justify-center rounded-lg border transition"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Security Tips */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-400">Bonnes pratiques de sécurité</h3>
            <ul className="mt-2 space-y-1 text-sm text-amber-400/80">
              <li>• Utilisez des mots de passe forts (au moins 12 caractères)</li>
              <li>• Ne partagez jamais vos identifiants de connexion</li>
              <li>• Changez régulièrement vos mots de passe</li>
              <li>• Limitez le nombre d&apos;administrateurs au strict nécessaire</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <UserDrawer
            mode={drawerMode}
            user={currentUser}
            generatedPassword={generatedPassword}
            isSubmitting={isSubmitting}
            onClose={closeDrawer}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onChangePassword={handleChangePassword}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="border-gold/20 bg-night w-full max-w-md rounded-2xl border p-6"
            >
              <h3 className="text-ivory text-lg font-semibold">Supprimer l&apos;utilisateur</h3>
              <p className="text-ivory/60 mt-2 text-sm">
                Êtes-vous sûr de vouloir supprimer{' '}
                <span className="text-ivory font-medium">{deleteTarget.email}</span> ? Cette action
                retire définitivement l&apos;accès administrateur.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="text-ivory/70 hover:text-ivory rounded-lg px-4 py-2 text-sm font-medium transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  disabled={isSubmitting}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface UserDrawerProps {
  mode: 'create' | 'edit' | 'password';
  user: AdminUser | null;
  generatedPassword: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (values: { email: string; password: string }) => void;
  onUpdate: (id: string, values: { email: string }) => void;
  onChangePassword: (id: string, values: { currentPassword?: string; newPassword: string }) => void;
}

/** Tiroir latéral pour la création/édition d'un utilisateur */
function UserDrawer({
  mode,
  user,
  generatedPassword,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
  onChangePassword,
}: UserDrawerProps) {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    setEmail(user?.email || '');
    setPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [user, mode]);

  /** Gère la soumission du formulaire */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      onCreate({ email, password });
    } else if (mode === 'edit' && user) {
      onUpdate(user.id, { email });
    } else if (mode === 'password' && user) {
      if (newPassword !== confirmPassword) {
        return;
      }
      onChangePassword(user.id, {
        currentPassword: currentPassword || undefined,
        newPassword,
      });
    }
  };

  /** Génère un mot de passe aléatoire */
  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (mode === 'create') {
      setPassword(result);
    } else {
      setNewPassword(result);
      setConfirmPassword(result);
    }
  };

  /** Copie un mot de passe dans le presse-papier */
  const copyPassword = async (pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      console.error('Failed to copy password');
    }
  };

  const passwordsMatch = newPassword === confirmPassword;

  /** Retourne le titre du tiroir selon le mode */
  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Nouvel utilisateur';
      case 'edit':
        return "Modifier l'utilisateur";
      case 'password':
        return generatedPassword ? 'Mot de passe réinitialisé' : 'Changer le mot de passe';
    }
  };

  /** Retourne la description du tiroir selon le mode */
  const getDescription = () => {
    switch (mode) {
      case 'create':
        return 'Créer un accès administrateur en définissant un mot de passe temporaire.';
      case 'edit':
        return 'Mettre à jour les informations de connexion.';
      case 'password':
        return generatedPassword
          ? 'Un nouveau mot de passe temporaire a été généré. Copiez-le et partagez-le de manière sécurisée.'
          : 'Définissez un nouveau mot de passe pour cet utilisateur.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="border-gold/20 bg-night/95 h-full w-full max-w-md overflow-y-auto border-l p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-ivory text-xl font-semibold">{getTitle()}</h3>
            <p className="text-ivory/70 text-sm">{getDescription()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/70 hover:bg-ivory/10 hover:text-ivory rounded-lg p-2 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Generated Password Display */}
        {generatedPassword && mode === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-gold/30 bg-gold/10 mt-6 rounded-xl border p-4"
          >
            <p className="text-gold mb-2 text-sm font-medium">Mot de passe temporaire :</p>
            <div className="flex items-center gap-2">
              <code className="bg-night/60 text-ivory flex-1 rounded-lg px-3 py-2 font-mono text-sm">
                {generatedPassword}
              </code>
              <button
                onClick={() => copyPassword(generatedPassword)}
                className={`rounded-lg p-2 transition ${
                  passwordCopied
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gold/20 text-gold hover:bg-gold/30'
                }`}
              >
                {passwordCopied ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-gold/70 mt-2 text-xs">
              Partagez ce mot de passe de manière sécurisée. L&apos;utilisateur pourra le modifier
              après connexion.
            </p>
          </motion.div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Email Field */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="space-y-2">
              <label htmlFor="user-email" className="text-ivory text-sm font-medium">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="text-ivory/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border-ivory/20 bg-night/60 text-ivory focus:border-gold focus:ring-gold w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-1"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          )}

          {/* Password Field for Create */}
          {mode === 'create' && (
            <div className="space-y-2">
              <label htmlFor="user-password" className="text-ivory text-sm font-medium">
                Mot de passe temporaire
              </label>
              <div className="relative">
                <Lock className="text-ivory/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="border-ivory/20 bg-night/60 text-ivory focus:border-gold focus:ring-gold w-full rounded-lg border py-2.5 pl-10 pr-20 text-sm outline-none transition focus:ring-1"
                  placeholder="Au moins 8 caractères"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ivory/40 hover:text-ivory rounded p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-ivory/40 hover:text-gold rounded p-1"
                    title="Générer un mot de passe"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-ivory/50 text-xs">
                Partagez ce mot de passe avec l&apos;utilisateur. Il pourra le modifier après
                connexion.
              </p>
            </div>
          )}

          {/* Password Change Fields */}
          {mode === 'password' && !generatedPassword && (
            <>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-ivory text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="text-ivory/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    minLength={8}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="border-ivory/20 bg-night/60 text-ivory focus:border-gold focus:ring-gold w-full rounded-lg border py-2.5 pl-10 pr-20 text-sm outline-none transition focus:ring-1"
                    placeholder="Au moins 8 caractères"
                  />
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-ivory/40 hover:text-ivory rounded p-1"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-ivory/40 hover:text-gold rounded p-1"
                      title="Générer un mot de passe"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-ivory text-sm font-medium">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="text-ivory/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`bg-night/60 text-ivory w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-1 ${
                      confirmPassword && !passwordsMatch
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-ivory/20 focus:border-gold focus:ring-gold'
                    }`}
                    placeholder="Répétez le mot de passe"
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-ivory/70 hover:text-ivory rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              {generatedPassword ? 'Fermer' : 'Annuler'}
            </button>
            {!generatedPassword && (
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (mode === 'create' && password.length < 8) ||
                  (mode === 'password' && (!passwordsMatch || newPassword.length < 8))
                }
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Enregistrement...'
                  : mode === 'create'
                    ? 'Créer'
                    : mode === 'edit'
                      ? 'Mettre à jour'
                      : 'Changer le mot de passe'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
