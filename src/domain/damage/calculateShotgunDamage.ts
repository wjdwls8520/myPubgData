/** All selected pellets hit the same selected body part; no spread probability model. */
export function calculateShotgunDamage(perPellet: number | null, hits: number, pelletCount: number): number | null {
  if (perPellet === null || !Number.isFinite(perPellet) || perPellet < 0 || !Number.isInteger(hits) || hits < 0 || hits > pelletCount || !Number.isInteger(pelletCount) || pelletCount < 1) return null;
  return perPellet * hits;
}
