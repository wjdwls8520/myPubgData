import type { DamageRules, Scope, Weapon } from '../weapon/schema';
import { calculateBoltTTK } from './calculateBoltTTK';
import { calculateBurstTTK } from './calculateBurstTTK';
export interface TimingSettings { timing: 'normal' | 'perfect' | 'custom'; clickIntervalMs: number; scope: Scope; rpmMode: 'default' | 'slow' }
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
export function getEffectiveRPM(weapon: Weapon, rpmMode: TimingSettings['rpmMode']): number | null {
  return weapon.firing.kind === 'auto' && rpmMode === 'slow' ? Math.min(...weapon.firing.rpmOptions) : weapon.firing.rpm;
}
export function calculateTTK(weapon: Weapon, hits: number | null, settings: TimingSettings, rules: DamageRules): number | null {
  if (hits === null || !Number.isInteger(hits) || hits < 1) return null;
  if (hits === 1) return 0;
  const f = weapon.firing;
  if (f.cycleLimit !== null && hits > f.cycleLimit) return null;
  if (f.kind === 'bolt') return calculateBoltTTK(hits, rules.bolts[f.timingId]?.intervals[settings.scope] ?? null);
  const rpm = getEffectiveRPM(weapon, settings.rpmMode);
  const interval = rpm !== null && rpm > 0 ? SECONDS_PER_MINUTE / rpm : null;
  if (settings.timing === 'custom' && (!Number.isFinite(settings.clickIntervalMs) || settings.clickIntervalMs <= 0)) return null;
  const clickInterval = settings.clickIntervalMs / MILLISECONDS_PER_SECOND;
  if (f.kind === 'burst') {
    const boundary = settings.timing === 'normal' ? f.normalBoundaryInterval : settings.timing === 'perfect' ? f.perfectBoundaryInterval : f.intraBurstInterval === null || f.perfectBoundaryInterval === null ? null : Math.max(f.perfectBoundaryInterval, clickInterval - (f.burstSize - 1) * f.intraBurstInterval);
    return calculateBurstTTK(hits, f.burstSize, f.intraBurstInterval, boundary);
  }
  if (f.kind === 'auto') return calculateBoltTTK(hits, interval);
  const selectedInterval = settings.timing === 'normal' ? f.normalInterval : settings.timing === 'custom' && interval !== null ? Math.max(interval, clickInterval) : interval;
  return calculateBoltTTK(hits, selectedInterval);
}
