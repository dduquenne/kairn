"use client";

import type { ChatbotStats } from "../types";

interface ChatbotStatsCardsProps {
  stats: ChatbotStats;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "gold" | "green" | "rose" | "blue";
  loading?: boolean;
}) {
  const accentColors = {
    gold: "border-gold/30 bg-gold/5",
    green: "border-emerald-400/30 bg-emerald-400/5",
    rose: "border-rose-400/30 bg-rose-400/5",
    blue: "border-blue-400/30 bg-blue-400/5",
  };

  const valueColors = {
    gold: "text-gold",
    green: "text-emerald-400",
    rose: "text-rose-400",
    blue: "text-blue-400",
  };

  const color = accent || "gold";

  if (loading) {
    return (
      <div className="rounded-xl border border-gold/20 bg-night/60 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 rounded bg-gold/20" />
          <div className="h-7 w-16 rounded bg-gold/10" />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${accentColors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-ivory/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColors[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ivory/40">{sub}</p>}
    </div>
  );
}

export function ChatbotStatsCards({ stats, loading }: ChatbotStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Total conversations"
        value={stats.totalConversations}
        sub={`${stats.todayConversations} aujourd'hui`}
        accent="gold"
        loading={loading}
      />
      <StatCard
        label="En cours"
        value={stats.activeConversations}
        accent="blue"
        loading={loading}
      />
      <StatCard
        label="Messages"
        value={stats.totalMessages}
        sub={`~${stats.avgMessagesPerConversation} / conv.`}
        accent="gold"
        loading={loading}
      />
      <StatCard
        label="Satisfaction"
        value={stats.satisfactionRate !== null ? `${stats.satisfactionRate}%` : "—"}
        sub={`${stats.satisfiedCount} positifs / ${stats.unsatisfiedCount} négatifs`}
        accent={
          stats.satisfactionRate !== null && stats.satisfactionRate >= 70
            ? "green"
            : stats.satisfactionRate !== null && stats.satisfactionRate < 50
              ? "rose"
              : "gold"
        }
        loading={loading}
      />
      <StatCard
        label="Cette semaine"
        value={stats.weekConversations}
        accent="blue"
        loading={loading}
      />
    </div>
  );
}
