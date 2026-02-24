"use client";

import type { ConversationPreview } from "../types";

interface ConversationsTableProps {
  conversations: ConversationPreview[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView: (conversation: ConversationPreview) => void;
  onDelete: (conversation: ConversationPreview) => void;
}

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

  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
    ended: "bg-ivory/10 text-ivory/60 border-ivory/20",
    transferred: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  };

  const labels: Record<string, string> = {
    active: "En cours",
    ended: "Terminée",
    transferred: "Transférée",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] || styles.ended}`}
    >
      {labels[status] || status}
    </span>
  );
}

function SatisfactionBadge({ satisfied }: { satisfied: boolean | null }) {
  if (satisfied === null) {
    return (
      <span className="inline-flex items-center text-xs text-ivory/30">—</span>
    );
  }

  return satisfied ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <span className="text-sm">👍</span> Satisfait
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-rose-400">
      <span className="text-sm">👎</span> Insatisfait
    </span>
  );
}

export function ConversationsTable({
  conversations,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onDelete,
}: ConversationsTableProps) {
  const allSelected =
    conversations.length > 0 && conversations.every((c) => selectedIds.has(c.id));

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-gold/20 bg-night/60 p-12 text-center">
        <p className="text-4xl">💬</p>
        <p className="mt-3 text-lg font-medium text-ivory/70">
          Aucune conversation trouvée
        </p>
        <p className="mt-1 text-sm text-ivory/40">
          Les conversations du ChatBot IA apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gold/20 bg-night/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gold/20">
            <th className="px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-gold/40 bg-night/60 accent-gold"
              />
            </th>
            <th className="px-3 py-3 text-left font-semibold text-ivory/70">
              Aperçu
            </th>
            <th className="hidden px-3 py-3 text-left font-semibold text-ivory/70 sm:table-cell">
              Statut
            </th>
            <th className="hidden px-3 py-3 text-center font-semibold text-ivory/70 md:table-cell">
              Messages
            </th>
            <th className="hidden px-3 py-3 text-left font-semibold text-ivory/70 lg:table-cell">
              Satisfaction
            </th>
            <th className="px-3 py-3 text-left font-semibold text-ivory/70">Date</th>
            <th className="px-3 py-3 text-right font-semibold text-ivory/70">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conv) => (
            <tr
              key={conv.id}
              className="border-b border-gold/10 transition hover:bg-gold/5"
            >
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(conv.id)}
                  onChange={() => onToggleSelect(conv.id)}
                  className="h-4 w-4 rounded border-gold/40 bg-night/60 accent-gold"
                />
              </td>
              <td className="max-w-xs px-3 py-3">
                <button
                  onClick={() => onView(conv)}
                  className="block w-full text-left transition hover:text-gold"
                >
                  <p className="truncate font-medium text-ivory/90">
                    {conv.firstUserMessage || conv.preview || "Conversation vide"}
                  </p>
                  {conv.referrer && (
                    <p className="mt-0.5 truncate text-xs text-ivory/40">
                      depuis {conv.referrer}
                    </p>
                  )}
                </button>
              </td>
              <td className="hidden px-3 py-3 sm:table-cell">
                <StatusBadge status={conv.status} />
              </td>
              <td className="hidden px-3 py-3 text-center text-ivory/60 md:table-cell">
                {conv.messageCount}
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                <SatisfactionBadge satisfied={conv.satisfied} />
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-ivory/50">
                {formatDate(conv.createdAt)}
              </td>
              <td className="px-3 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(conv)}
                    className="rounded-md px-2 py-1 text-xs text-ivory/60 transition hover:bg-gold/10 hover:text-gold"
                    title="Voir le détail"
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => onDelete(conv)}
                    className="rounded-md px-2 py-1 text-xs text-ivory/60 transition hover:bg-rose-400/10 hover:text-rose-400"
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
