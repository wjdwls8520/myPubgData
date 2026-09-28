export type WeaponClass =
  "AR" | "SMG" | "DMR" | "SR" | "LMG" | "SHOTGUN" | "HANDGUN";
export type BodyPart =
  | "Head"
  | "Neck"
  | "Clavicle"
  | "Chest"
  | "UpperStomach"
  | "LowerStomach"
  | "Pelvis"
  | "UpperArm"
  | "Forearm"
  | "Hand"
  | "Thigh"
  | "Calf"
  | "Foot";
export type ArmorLevel = 0 | 1 | 2 | 3;
export type Scope = "no-ads" | "2x" | "4x" | "6x" | "8x";
type SkillIntervals = { perfect: number; normal: number; low: number };
export type Timing =
  | { type: "full_auto"; tbs: number }
  | {
      type: "burst";
      skilledTbsValues: SkillIntervals;
      inBurstIntervals: number[];
    }
  | { type: "single_fire"; skilledTbsValues: SkillIntervals }
  | {
      type: "double_barrel_shotgun";
      skilledTbsValues: SkillIntervals;
      reloadTime: number;
    }
  | { type: "bolt_zoom"; scopeTbsValues: Partial<Record<Scope, number>> }
  | { type: "mg3"; mode990Tbs: number; mode660Tbs: number }
  | {
      type: "mk14";
      fullAutoTbs: number;
      singleFireSkilledTbsValues: SkillIntervals;
    }
  | { type: "vss"; fullAutoTbs: number }
  | { type: "win94"; noScopeTbs: number; scopeTbsValues: number };
export interface Ballistics {
  id: string;
  baseDamage: number;
  maxDistance: number;
  damagePoints: { x: number; y: number }[];
  pubgVersion: { major: number; minor: number };
  timings: Timing;
}
export interface Conditions {
  distance: number;
  helmet: ArmorLevel;
  vest: ArmorLevel;
  skill: "perfect" | "normal";
  scope: Scope;
  mg3Mode: "990" | "660";
  shotgunMode: "pellet" | "all";
}
export interface HitResult {
  damage: number;
  hits: number;
  ttk: number | null;
}
