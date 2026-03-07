'use client';

import type { ConversationPreview } from './types';

interface ConversationsTableProps {
  conversations: ConversationPreview[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView: (conversation: ConversationPreview) => void;
  onDelete: (conversation: ConversationPreview) => void;
}

/** Format a date string relative to now */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;

  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Status badge component */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
    ended: 'bg-ivory/10 text-ivory/60 border-ivory/20',
    transferred: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
  };

  const labels: Record<string, string> = {
    active: 'En cours',
    ended: 'Terminée',
    transferred: 'Transférée',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] || styles.ended}`}
    >
      {labels[status] || status}
    </span>
  );
}

/** Satisfaction indicator */
function SatisfactionBadge({ satisfied }: { satisfied: boolean | null }) {
  if (satisfied === null) {
    return <span className="text-ivory/30 inline-flex items-center text-xs">—</span>;
  }

  return satisfied ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <span className="text-sm">{'\uD83D\uDC4D'}</span> Satisfait
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-rose-400">
      <span className="text-sm">{'\uD83D\uDC4E'}</span> Insatisfait
    </span>
  );
}

/** Table listing chatbot conversations */
export function ConversationsTable({
  conversations,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onDelete,
}: ConversationsTableProps) {
  const allSelected = conversations.length > 0 && conversations.every(c => selectedIds.has(c.id));

  if (conversations.length === 0) {
    return (
      <div className="border-gold/20 bg-night/60 rounded-xl border p-12 text-center">
        <p className="text-4xl">{'\uD83D\uDCAC'}</p>
        <p className="text-ivory/70 mt-3 text-lg font-medium">Aucune conversation trouvée</p>
        <p className="text-ivory/40 mt-1 text-sm">
          Les conversations du ChatBot IA apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="border-gold/20 bg-night/60 overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-gold/20 border-b">
            <th className="px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="border-gold/40 bg-night/60 accent-gold h-4 w-4 rounded"
              />
            </th>
            <th className="text-ivory/70 px-3 py-3 text-left font-semibold">Aperçu</th>
            <th className="text-ivory/70 hidden px-3 py-3 text-left font-semibold sm:table-cell">
              Statut
            </th>
            <th className="text-ivory/70 hidden px-3 py-3 text-center font-semibold md:table-cell">
              Messages
            </th>
            <th className="text-ivory/70 hidden px-3 py-3 text-left font-semibold lg:table-cell">
              Satisfaction
            </th>
            <th className="text-ivory/70 px-3 py-3 text-left font-semibold">Date</th>
            <th className="text-ivory/70 px-3 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map(conv => (
            <tr key={conv.id} className="border-gold/10 hover:bg-gold/5 border-b transition">
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(conv.id)}
                  onChange={() => onToggleSelect(conv.id)}
                  className="border-gold/40 bg-night/60 accent-gold h-4 w-4 rounded"
                />
              </td>
              <td className="max-w-xs px-3 py-3">
                <button
                  onClick={() => onView(conv)}
                  className="hover:text-gold block w-full text-left transition"
                >
                  <p className="text-ivory/90 truncate font-medium">
                    {conv.firstUserMessage || conv.preview || 'Conversation vide'}
                  </p>
                  {conv.referrer && (
                    <p className="text-ivory/40 mt-0.5 truncate text-xs">depuis {conv.referrer}</p>
                  )}
                </button>
              </td>
              <td className="hidden px-3 py-3 sm:table-cell">
                <StatusBadge status={conv.status} />
              </td>
              <td className="text-ivory/60 hidden px-3 py-3 text-center md:table-cell">
                {conv.messageCount}
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                <SatisfactionBadge satisfied={conv.satisfied} />
              </td>
              <td className="text-ivory/50 whitespace-nowrap px-3 py-3">
                {formatDate(conv.createdAt)}
              </td>
              <td className="px-3 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(conv)}
                    className="text-ivory/60 hover:bg-gold/10 hover:text-gold rounded-md px-2 py-1 text-xs transition"
                    title="Voir le détail"
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => onDelete(conv)}
                    className="text-ivory/60 rounded-md px-2 py-1 text-xs transition hover:bg-rose-400/10 hover:text-rose-400"
                    title="Supprimer"
                  >
                    Suppr.
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
