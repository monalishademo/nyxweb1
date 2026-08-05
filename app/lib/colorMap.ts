export const colorMap: Record<string, { r: number; g: number; b: number; hex: string }> = {
  black: { r: 0, g: 0, b: 0, hex: '#000000' },
  blue: { r: 0, g: 0.44, b: 0.95, hex: '#0070f3' },
  darkblue: { r: 0.05, g: 0.15, b: 0.5, hex: '#0f172a' },
  red: { r: 0.93, g: 0.27, b: 0.27, hex: '#ef4444' },
  crimson: { r: 0.6, g: 0, b: 0.1, hex: '#9f1239' },
  green: { r: 0.13, g: 0.77, b: 0.37, hex: '#22c55e' },
  emerald: { r: 0.02, g: 0.47, b: 0.34, hex: '#065f46' },
  orange: { r: 0.97, g: 0.45, b: 0.09, hex: '#f97316' },
  purple: { r: 0.54, g: 0.36, b: 0.96, hex: '#8b5cf6' },
  gray: { r: 0.39, g: 0.45, b: 0.55, hex: '#64748b' },
};

export const commonWatermarks = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'URGENT', 'APPROVED', 'COPYRIGHT'];
