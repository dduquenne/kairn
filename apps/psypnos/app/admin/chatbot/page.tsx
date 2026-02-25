'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/lib/toast-context';

import { DeleteConfirmation } from '../_components/DeleteConfirmation';

import { ChatbotSkeleton } from './_components/ChatbotSkeleton';
import { ChatbotStatsCards } from './_components/ChatbotStats';
import { ChatbotToggle } from './_components/ChatbotToggle';
import { ConversationDrawer } from './_components/ConversationDrawer';
import { ConversationFilters } from './_components/ConversationFilters';
import { ConversationsTable } from './_components/ConversationsTable';
import { Pagination } from './_components/Pagination';
import type {
  ConversationPreview,
  ConversationsResponse,
  ChatbotStats,
  PaginationInfo,
} from './types';

const DEFAULT_STATS: ChatbotStats = {
  totalConversations: 0,
  activeConversations: 0,
  satisfiedCount: 0,
  unsatisfiedCount: 0,
  satisfactionRate: null,
  totalMessages: 0,
  avgMessagesPerConversation: 0,
  todayConversations: 0,
  weekConversations: 0,
};

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export default function ChatbotAdminPage() {
  const { addToast } = useToast();

  // Data state
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [stats, setStats] = useState<ChatbotStats>(DEFAULT_STATS);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);

  // UI state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerConversation, setDrawerConversation] = useState<ConversationPreview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConversationPreview | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [satisfactionFilter, setSatisfactionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, satisfactionFilter]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (satisfactionFilter) params.set('satisfaction', satisfactionFilter);

      const response = await fetch(`/api/admin/chatbot/conversations?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data: ConversationsResponse = await response.json();
      setConversations(data.conversations);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      addToast({
        title: 'Erreur de chargement',
        description:
          error instanceof Error ? error.message : 'Impossible de charger les conversations',
        variant: 'error',
      });
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, satisfactionFilter, addToast]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  // Selection handlers
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (conversations.every(c => selectedIds.has(c.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map(c => c.id)));
    }
  }

  // Delete single conversation
  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/chatbot/conversations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setConversations(prev => prev.filter(c => c.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      setDeleteTarget(null);
      setDrawerConversation(null);

      addToast({
        title: 'Conversation supprimée',
        description: 'La conversation a été supprimée avec succès',
        variant: 'success',
      });

      // Refresh stats
      void fetchConversations();
    } catch (error) {
      addToast({
        title: 'Erreur de suppression',
        description:
          error instanceof Error ? error.message : 'Impossible de supprimer la conversation',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  // Bulk delete
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/chatbot/conversations/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');

      const data = await response.json();
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);

      addToast({
        title: 'Conversations supprimées',
        description: `${data.deleted} conversation(s) supprimée(s)`,
        variant: 'success',
      });

      void fetchConversations();
    } catch (error) {
      addToast({
        title: 'Erreur de suppression',
        description:
          error instanceof Error ? error.message : 'Impossible de supprimer les conversations',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isInitialLoading) {
    return <ChatbotSkeleton />;
  }

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-ivory text-2xl font-semibold">ChatBot IA</h2>
          <p className="text-ivory/60 text-sm">
            Historique des conversations et gestion du chatbot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchConversations()}
          disabled={isRefreshing}
          className="border-gold/40 text-gold hover:bg-gold/10 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Chatbot toggle */}
      <ChatbotToggle
        onStatusChange={enabled => {
          addToast({
            title: enabled ? 'ChatBot IA activé' : 'ChatBot IA désactivé',
            description: enabled
              ? 'Le chatbot est maintenant visible sur le site'
              : 'Le chatbot est masqué pour les visiteurs',
            variant: 'success',
          });
        }}
      />

      {/* Stats */}
      <ChatbotStatsCards stats={stats} loading={isRefreshing} />

      {/* Filters */}
      <ConversationFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        satisfactionFilter={satisfactionFilter}
        onSatisfactionFilterChange={setSatisfactionFilter}
      />

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="border-gold/20 bg-gold/5 flex items-center gap-3 rounded-lg border px-4 py-2">
          <span className="text-gold text-sm">
            {selectedIds.size} conversation{selectedIds.size > 1 ? 's' : ''} sélectionnée
            {selectedIds.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            className="text-ivory rounded-md bg-rose-500/80 px-3 py-1 text-xs font-semibold transition hover:bg-rose-500"
          >
            Supprimer la sélection
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-ivory/50 hover:text-ivory text-xs transition"
          >
            Tout désélectionner
          </button>
        </div>
      )}

      {/* Conversations table */}
      <ConversationsTable
        conversations={conversations}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onView={setDrawerConversation}
        onDelete={setDeleteTarget}
      />

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={setCurrentPage} />

      {/* Conversation detail drawer */}
      <ConversationDrawer
        conversation={drawerConversation}
        open={Boolean(drawerConversation)}
        onClose={() => setDrawerConversation(null)}
        onDelete={conv => {
          setDrawerConversation(null);
          setDeleteTarget(conv);
        }}
      />

      {/* Single delete confirmation */}
      <DeleteConfirmation
        open={Boolean(deleteTarget)}
        title="Supprimer la conversation"
        description={
          deleteTarget
            ? `Êtes-vous sûr de vouloir supprimer cette conversation (${deleteTarget.messageCount} messages) ? Cette action est irréversible.`
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

      {/* Bulk delete confirmation */}
      <DeleteConfirmation
        open={bulkDeleteConfirm}
        title="Supprimer les conversations sélectionnées"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} conversation${selectedIds.size > 1 ? 's' : ''} ? Cette action est irréversible.`}
        loading={isDeleting}
        onCancel={() => setBulkDeleteConfirm(false)}
        onConfirm={() => void handleBulkDelete()}
      />
    </section>
  );
}
