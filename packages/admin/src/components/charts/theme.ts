/**
 * Shared chart theme configuration
 */

export const CHART_COLORS = {
  gold: "#D4AF37",
  green: "#4ADE80",
  blue: "#60A5FA",
  purple: "#C084FC",
  red: "#F87171",
  orange: "#FB923C",
  cyan: "#22D3EE",
  pink: "#F472B6",
};

export const chartTheme = {
  // Background colors
  background: {
    card: "from-night/60 to-night/40",
    tooltip: "rgba(13,10,8,0.95)",
  },
  // Border colors
  border: {
    card: "gold/20",
    tooltip: "rgba(212,175,55,0.5)",
  },
  // Grid
  grid: {
    stroke: "rgba(199,169,98,0.1)",
    strokeDasharray: "3 3",
  },
  // Axis
  axis: {
    stroke: "#C7A962",
    fontSize: "12px",
    tick: { fill: "rgba(245,241,230,0.7)" },
  },
  // Tooltip
  tooltip: {
    contentStyle: {
      backgroundColor: "rgba(13,10,8,0.95)",
      border: "1px solid rgba(212,175,55,0.5)",
      borderRadius: "8px",
      padding: "12px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    },
    labelStyle: {
      color: "#D4AF37",
      fontWeight: "600",
      fontSize: "13px",
      marginBottom: "4px",
    },
    itemStyle: {
      color: "#F5F1E6",
      fontSize: "14px",
      fontWeight: "700",
    },
    cursor: {
      stroke: "rgba(212,175,55,0.3)",
      strokeWidth: 2,
    },
  },
  // Animations
  animation: {
    duration: 800,
  },
};
