import type { Weapon } from '../weapon/schema';
/** Public rounded samples; linear interpolation is our explicit approximation. No extrapolation. */
export function calculateDistanceDamage(weapon: Pick<Weapon, 'falloff'>, distance: number): number | null {
  if (!Number.isFinite(distance) || distance < 0) return null;
  const points = weapon.falloff;
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last || distance < first.distance || distance > last.distance) return null;
  const exact = points.find(p => p.distance === distance);
  if (exact) return exact.damage;
  const index = points.findIndex(p => p.distance > distance);
  const upper = points[index];
  const lower = points[index - 1];
  if (!upper || !lower || upper.distance <= lower.distance) return null;
  const ratio = (distance - lower.distance) / (upper.distance - lower.distance);
  return lower.damage + ratio * (upper.damage - lower.damage);
}
