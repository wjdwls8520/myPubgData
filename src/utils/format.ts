import type { Metric } from './urlState';
export function number(value: number | null | undefined, decimals = 1): string { return value == null || !Number.isFinite(value) ? '—' : value.toFixed(decimals); }
export function metric(value: number | null, type: Metric): string { return value === null ? '—' : type === 'ttk' ? `${number(value, 3)}초` : number(value, type === 'htk' ? 0 : 1); }
export const metricLabels = { damage: '데미지', htk: 'HTK', ttk: 'TTK' };
