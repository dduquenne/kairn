// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { ReactNode } from "react";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface SparklineData {
  value: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  iconComponent?: LucideIcon;
  change?: {
    value: number;
    isPositive: boolean;
  };
  changeLabel?: string;
  sparklineData?: SparklineData[];
  accentColor?: "gold" | "green" | "blue" | "purple";
  description?: string;
}

// Mini sparkline component
function Sparkline({ data, color = "#D4AF37" }: { data: SparklineData[]; color?: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  const width = 80;
  const height = 24;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ACCENT_COLORS = {
  gold: {
    bg: "from-gold/10 to-gold/5",
    border: "border-gold/30",
    icon: "bg-gold/20 text-gold",
    value: "text-gold",
  },
  green: {
    bg: "from-green-500/10 to-green-500/5",
    border: "border-green-500/30",
    icon: "bg-green-500/20 text-green-400",
    value: "text-green-400",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/30",
    icon: "bg-blue-500/20 text-blue-400",
    value: "text-blue-400",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/30",
    icon: "bg-purple-500/20 text-purple-400",
    value: "text-purple-400",
  },
};

const SPARKLINE_COLORS = {
  gold: "#D4AF37",
  green: "#4ADE80",
  blue: "#60A5FA",
  purple: "#C084FC",
};

export function StatCard({
  label,
  value,
  icon,
  iconComponent: IconComponent,
  change,
  changeLabel,
  sparklineData,
  accentColor = "gold",
  description,
}: StatCardProps) {
  const colors = ACCENT_COLORS[accentColor];
  const sparklineColor = SPARKLINE_COLORS[accentColor];

  // Determine trend icon based on change
  const getTrendIcon = () => {
    if (!change) return null;
    if (Math.abs(change.value) < 0.5) {
      return <Minus size={14} className="text-ivory/50" />;
    }
    return change.isPositive ? (
      <TrendingUp size={14} className="text-green-400" />
    ) : (
      <TrendingDown size={14} className="text-red-400" />
    );
  };

  return (
    <div className={`rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label with optional description tooltip */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ivory/70 truncate">{label}</p>
            {description && (
              <span className="group relative">
                <span className="text-ivory/30 cursor-help text-xs">ⓘ</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-night border border-gold/20 rounded text-ivory/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {description}
                </span>
              </span>
            )}
          </div>

          {/* Value with trend indicator */}
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${colors.value} tracking-tight`}>{value}</p>
            {getTrendIcon()}
          </div>

          {/* Change indicator */}
          {change && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                Math.abs(change.value) < 0.5
                  ? "bg-ivory/10 text-ivory/60"
                  : change.isPositive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
              }`}>
                {change.isPositive ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                )}
                <span>{change.value >= 0 ? "+" : ""}{change.value.toFixed(1)}%</span>
              </div>
              {changeLabel && (
                <span className="text-xs text-ivory/40">{changeLabel}</span>
              )}
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3">
              <Sparkline data={sparklineData} color={sparklineColor} />
            </div>
          )}
        </div>

        {/* Icon */}
        {(IconComponent || icon) && (
          <div className={`p-3 rounded-xl ${colors.icon} shrink-0`}>
            {IconComponent ? (
              <IconComponent size={24} />
            ) : (
              <span className="text-2xl">{icon}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
