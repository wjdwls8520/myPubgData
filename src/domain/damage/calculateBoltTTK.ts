export function calculateBoltTTK(hits: number, interval: number | null): number | null {
  if (!Number.isInteger(hits) || hits < 1) return null;
  if (hits === 1) return 0;
  if (interval === null || !Number.isFinite(interval) || interval <= 0) return null;
  return (hits - 1) * interval;
}
