export function calculateHTK(damage: number | null, health = 100): number | null {
  if (damage === null || !Number.isFinite(damage) || damage <= 0 || !Number.isFinite(health) || health <= 0) return null;
  return Math.ceil(health / damage);
}
