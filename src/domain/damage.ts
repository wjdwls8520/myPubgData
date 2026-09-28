import type { Weapon } from "../data/weapons";
import type {
  Ballistics,
  BodyPart,
  Conditions,
  HitResult,
  Timing,
  WeaponClass,
} from "./types";

export const DEFAULT_CONDITIONS: Conditions = {
  distance: 0,
  helmet: 2,
  vest: 2,
  skill: "perfect",
  scope: "4x",
  mg3Mode: "990",
  shotgunMode: "all",
};
type Region = "head" | "torso" | "pelvis" | "limbs";
export const BODY_PARTS: {
  id: BodyPart;
  label: string;
  region: Region;
  multiplier: number;
}[] = [
  { id: "Head", label: "머리", region: "head", multiplier: 1 },
  { id: "Neck", label: "목", region: "head", multiplier: 0.75 },
  { id: "Clavicle", label: "쇄골", region: "torso", multiplier: 1 },
  { id: "Chest", label: "가슴", region: "torso", multiplier: 1.1 },
  { id: "UpperStomach", label: "윗배", region: "torso", multiplier: 1 },
  { id: "LowerStomach", label: "아랫배", region: "torso", multiplier: 0.95 },
  { id: "Pelvis", label: "골반", region: "pelvis", multiplier: 1 },
  { id: "UpperArm", label: "위팔", region: "limbs", multiplier: 0.6 },
  { id: "Forearm", label: "아래팔", region: "limbs", multiplier: 0.5 },
  { id: "Hand", label: "손", region: "limbs", multiplier: 0.3 },
  { id: "Thigh", label: "허벅지", region: "limbs", multiplier: 0.6 },
  { id: "Calf", label: "종아리", region: "limbs", multiplier: 0.5 },
  { id: "Foot", label: "발", region: "limbs", multiplier: 0.3 },
];
const CLASS: Record<WeaponClass, Record<Region, number>> = {
  AR: { head: 2.35, torso: 1, pelvis: 1, limbs: 0.9 },
  DMR: { head: 2.35, torso: 1.05, pelvis: 1.05, limbs: 0.95 },
  SR: { head: 2.5, torso: 1.3, pelvis: 1.3, limbs: 0.95 },
  SMG: { head: 2.1, torso: 1.05, pelvis: 1.05, limbs: 1.3 },
  LMG: { head: 2.3, torso: 1.05, pelvis: 1, limbs: 0.9 },
  HANDGUN: { head: 2.1, torso: 1, pelvis: 1, limbs: 1.05 },
  SHOTGUN: { head: 1.5, torso: 0.9, pelvis: 0.9, limbs: 1.05 },
};
const ARMOR = [1, 0.7, 0.6, 0.45];

/** Interpolate telemetry samples, but never invent values beyond measured coverage. */
export function damageAtRange(
  data: Ballistics,
  distance: number,
): number | null {
  if (!Number.isFinite(distance) || distance < 0 || distance > data.maxDistance)
    return null;
  const points = data.damagePoints;
  if (distance <= points[0].x) return data.baseDamage;
  const right = points.findIndex((p) => p.x >= distance);
  if (right < 0) return points[points.length - 1].y;
  const a = points[right - 1],
    b = points[right];
  return a.y + ((b.y - a.y) * (distance - a.x)) / (b.x - a.x);
}

export function shotInterval(t: Timing, c: Conditions): number {
  switch (t.type) {
    case "full_auto":
      return t.tbs;
    case "single_fire":
    case "double_barrel_shotgun":
      return t.skilledTbsValues[c.skill];
    case "burst":
      return (
        (t.inBurstIntervals.reduce((a, b) => a + b, 0) +
          t.skilledTbsValues[c.skill]) /
        (t.inBurstIntervals.length + 1)
      );
    case "bolt_zoom":
      return t.scopeTbsValues[c.scope] ?? t.scopeTbsValues["no-ads"]!;
    case "mg3":
      return c.mg3Mode === "990" ? t.mode990Tbs : t.mode660Tbs;
    case "mk14":
    case "vss":
      return t.fullAutoTbs;
    case "win94":
      return c.scope === "no-ads" ? t.noScopeTbs : t.scopeTbsValues;
  }
}
export const rpmFor = (data: Ballistics, c: Conditions) =>
  10 * Math.round(60 / shotInterval(data.timings, c) / 10);

/** First hit is at t=0; burst gaps and double-barrel reloads are not average-RPM approximations. */
export function timeToKill(
  hits: number,
  timing: Timing,
  c: Conditions,
): number {
  if (hits <= 1) return 0;
  const intervals = hits - 1;
  if (timing.type === "burst") {
    const cycle = [
      ...timing.inBurstIntervals,
      timing.skilledTbsValues[c.skill],
    ];
    return (
      Math.floor(intervals / cycle.length) * cycle.reduce((a, b) => a + b, 0) +
      cycle.slice(0, intervals % cycle.length).reduce((a, b) => a + b, 0)
    );
  }
  if (timing.type === "double_barrel_shotgun") {
    const gap = timing.skilledTbsValues[c.skill];
    return (
      Math.floor(intervals / 2) * (gap + timing.reloadTime) +
      (intervals % 2) * gap
    );
  }
  return intervals * shotInterval(timing, c);
}

export function hitResult(
  w: Weapon,
  data: Ballistics,
  part: BodyPart,
  c: Conditions,
): HitResult | null {
  const base = damageAtRange(data, c.distance);
  if (base === null) return null;
  const info = BODY_PARTS.find((p) => p.id === part)!;
  const classMultiplier =
    w.referenceId === "Dragunov" && info.region === "head"
      ? 2.8
      : CLASS[w.weaponClass][info.region];
  const protection =
    info.region === "head"
      ? ARMOR[c.helmet]
      : info.region === "limbs"
        ? 1
        : ARMOR[c.vest];
  const pellets = c.shotgunMode === "all" ? w.pellets : 1;
  const damage =
    base * info.multiplier * classMultiplier * protection * pellets;
  // Do not round damage before calculating HTK near a 100 HP boundary.
  const hits = Math.ceil(100 / damage);
  return {
    damage,
    hits,
    ttk:
      w.pellets > 1 && c.shotgunMode === "pellet"
        ? null
        : timeToKill(hits, data.timings, c),
  };
}
export const displayDamage = (n: number | null | undefined) =>
  n == null ? "—" : Number(n.toFixed(1)).toString();
