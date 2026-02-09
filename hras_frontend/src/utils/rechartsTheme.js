/**
 * Recharts Light Theme Configuration
 * Consistent styling for all charts in HRAS
 */

// Light theme colors
export const chartColors = {
  // Chart data colors (vivid)
  blue: '#2563eb',      // blue-600
  green: '#10b981',     // green-600
  yellow: '#eab308',    // yellow-600
  orange: '#f97316',    // orange-600
  red: '#ef4444',       // red-600
  purple: '#9333ea',    // purple-600
  
  // UI colors (muted)
  grid: '#e5e7eb',      // gray-200
  axis: '#6b7280',      // gray-500
  text: '#374151',      // gray-700
  textMuted: '#6b7280', // gray-500
};

// Tooltip style for all charts
export const lightTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  color: '#1f2937',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  padding: '8px 12px',
};

// Legend style
export const lightLegendStyle = {
  color: '#374151',
  fontSize: 14,
};

// Axis configuration
export const lightAxisConfig = {
  stroke: chartColors.axis,
  tick: { fill: chartColors.axis, fontSize: 12 },
};

// Grid configuration
export const lightGridConfig = {
  strokeDasharray: '3 3',
  stroke: chartColors.grid,
};

// Priority colors (for patient data)
export const priorityColors = {
  Low: chartColors.green,
  Medium: chartColors.yellow,
  High: chartColors.orange,
  Critical: chartColors.red,
};

// Status colors
export const statusColors = {
  Available: chartColors.green,
  Occupied: chartColors.red,
  Maintenance: chartColors.yellow,
};

/**
 * Example usage in a component:
 * 
 * import { lightTooltipStyle, lightAxisConfig, lightGridConfig, chartColors } from '../utils/rechartsTheme';
 * 
 * <LineChart data={data}>
 *   <CartesianGrid {...lightGridConfig} />
 *   <XAxis {...lightAxisConfig} dataKey="date" />
 *   <YAxis {...lightAxisConfig} />
 *   <Tooltip contentStyle={lightTooltipStyle} />
 *   <Legend wrapperStyle={lightLegendStyle} />
 *   <Line type="monotone" dataKey="value" stroke={chartColors.blue} strokeWidth={2} />
 * </LineChart>
 */
