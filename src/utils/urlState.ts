import { bodyIds, categories, scopes } from '../domain/weapon/schema';
import type { BodyId, Category } from '../domain/weapon/schema';
import type { DamageSettings } from '../domain/damage/calculateDamage';
export type Metric = 'damage' | 'htk' | 'ttk';
export type Sort = 'type' | 'damage' | 'ammo' | 'htk' | 'ttk';
export interface ExplorerState extends DamageSettings { weapon: string; compare: string; body: BodyId; category: Category | 'ALL'; display: Metric; sort: Sort; search: string; archived: boolean }
function option<T extends string>(value: string | null, options: readonly T[], fallback: T): T { return options.find(o => o === value) ?? fallback; }
function numeric(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value.trim() === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
export function parseUrlState(params: URLSearchParams, maxDistance: number): ExplorerState {
  const helmet = option(params.get('helmet'), ['0', '1', '2', '3'], '2');
  const vest = option(params.get('vest'), ['0', '1', '2', '3'], '2');
  return {
    distance: numeric(params.get('distance'), 0, 0, maxDistance),
    helmet: helmet === '0' ? 0 : helmet === '1' ? 1 : helmet === '2' ? 2 : 3,
    vest: vest === '0' ? 0 : vest === '1' ? 1 : vest === '2' ? 2 : 3,
    weapon: params.get('weapon') || 'm416', compare: params.get('compare') || '', body: option(params.get('body'), bodyIds, 'chest'),
    category: option(params.get('category'), ['ALL', ...categories], 'ALL'), display: option(params.get('display'), ['damage', 'htk', 'ttk'], 'damage'),
    sort: option(params.get('sort'), ['type', 'damage', 'ammo', 'htk', 'ttk'], 'type'), search: (params.get('search') ?? '').slice(0, 80), archived: params.get('archived') === '1',
    timing: option(params.get('timing'), ['normal', 'perfect', 'custom'], 'perfect'), scope: option(params.get('scope'), scopes, '4x'),
    clickIntervalMs: numeric(params.get('click'), 200, 1, 5000), rpmMode: option(params.get('rpm'), ['default', 'slow'], 'default'),
    pellets: params.get('pellets') === null || params.get('pellets') === 'all' ? 'all' : Math.round(numeric(params.get('pellets'), 1, 1, 9)),
  };
}
export function updateUrlState(params: URLSearchParams, patch: Partial<ExplorerState>): URLSearchParams {
  const next = new URLSearchParams(params);
  const keyMap: Partial<Record<keyof ExplorerState, string>> = { clickIntervalMs: 'click', rpmMode: 'rpm' };
  for (const [key, value] of Object.entries(patch)) {
    const urlKey = keyMap[key as keyof ExplorerState] ?? key;
    if (value === '' || value === false) next.delete(urlKey);
    else next.set(urlKey, value === true ? '1' : String(value));
  }
  return next;
}
