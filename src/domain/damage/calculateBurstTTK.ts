/** Boundary interval = last shot of a burst → first shot of next burst. */
export function calculateBurstTTK(hits: number, burstSize: number, intra: number | null, boundary: number | null): number | null {
  if (!Number.isInteger(hits) || hits < 1 || !Number.isInteger(burstSize) || burstSize < 2) return null;
  if (hits === 1) return 0;
  if (intra === null || !Number.isFinite(intra) || intra <= 0) return null;
  const boundaries = Math.floor((hits - 1) / burstSize);
  if (boundaries > 0 && (boundary === null || !Number.isFinite(boundary) || boundary <= 0)) return null;
  return (hits - 1 - boundaries) * intra + boundaries * (boundary ?? 0);
}
