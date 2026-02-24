"use client";

interface ConversationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  satisfactionFilter: string;
  onSatisfactionFilterChange: (value: string) => void;
}

export function ConversationFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  satisfactionFilter,
  onSatisfactionFilterChange,
}: ConversationFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher dans les conversations..."
          className="w-full rounded-lg border border-gold/20 bg-night/60 px-3 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="rounded-lg border border-gold/20 bg-night/60 px-3 py-2 text-sm text-ivory focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
      >
        <option value="">Tous les statuts</option>
        <option value="active">En cours</option>
        <option value="ended">Terminée</option>
        <option value="transferred">Transférée</option>
      </select>

      {/* Satisfaction filter */}
      <select
        value={satisfactionFilter}
        onChange={(e) => onSatisfactionFilterChange(e.target.value)}
        className="rounded-lg border border-gold/20 bg-night/60 px-3 py-2 text-sm text-ivory focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
      >
        <option value="">Toute satisfaction</option>
        <option value="satisfied">Satisfait</option>
        <option value="unsatisfied">Insatisfait</option>
        <option value="no_feedback">Pas de retour</option>
      </select>
    </div>
  );
}
