/**
 * Chart Components
 *
 * Recharts wrappers for admin dashboards with consistent styling.
 */

export { LineChart, MultiLineChart } from './LineChart';
export { BarChart } from './BarChart';
export { AreaChart } from './AreaChart';
export { PieChart, DonutChart } from './PieChart';

// Types
export type { LineChartProps, MultiLineChartProps, LineConfig } from './LineChart';
export type { BarChartProps } from './BarChart';
export type { AreaChartProps } from './AreaChart';
export type { PieChartProps, DonutChartProps, PieDataPoint } from './PieChart';

// Shared theme config
export { chartTheme, CHART_COLORS } from './theme';
