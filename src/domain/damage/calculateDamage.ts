import type { BodyId, DamageRules, Weapon } from '../weapon/schema';
import { calculateDistanceDamage } from './calculateDistanceDamage';
import { calculateHTK } from './calculateHTK';
import { calculateShotgunDamage } from './calculateShotgunDamage';
import { calculateTTK, getEffectiveRPM } from './calculateTTK';
import type { TimingSettings } from './calculateTTK';
export type ArmorLevel = 0 | 1 | 2 | 3;
export interface DamageSettings extends TimingSettings { distance: number; helmet: ArmorLevel; vest: ArmorLevel; pellets: number | 'all' }
export interface DamageResult { base: number | null; damage: number | null; perPellet: number | null; pelletRange: [number, number] | null; rpm: number | null; htk: number | null; ttk: number | null; hitMultiplier: number; classMultiplier: number; armorMultiplier: number; reason: 'range' | 'pellets' | 'timing' | null }
export function calculateDamage(weapon: Weapon, bodyId: BodyId, settings: DamageSettings, rules: DamageRules): DamageResult {
  const body = rules.bodyParts.find(p => p.id === bodyId);
  if (!body) throw new Error(`Unknown body part ${bodyId}`);
  const hitMultiplier = body.hitMultiplier;
  const classMultiplier = weapon.multiplierOverrides[bodyId] ?? rules.classes[weapon.category][bodyId];
  const armorMultiplier = body.armor === 'none' ? 1 : rules.armor[settings[body.armor]];
  const base = calculateDistanceDamage(weapon, settings.distance);
  const perPellet = base === null ? null : base * hitMultiplier * classMultiplier * armorMultiplier;
  const pelletHits = settings.pellets === 'all' ? weapon.projectile.pelletCount : settings.pellets;
  const damage = weapon.projectile.kind === 'pellets' ? calculateShotgunDamage(perPellet, pelletHits, weapon.projectile.pelletCount) : perPellet;
  const htk = calculateHTK(damage, rules.health);
  const ttk = calculateTTK(weapon, htk, settings, rules);
  const fullPattern = weapon.projectile.kind === 'pellets' ? calculateShotgunDamage(perPellet, weapon.projectile.pelletCount, weapon.projectile.pelletCount) : null;
  const pelletRange: [number, number] | null = perPellet !== null && fullPattern !== null ? [perPellet, fullPattern] : null;
  return { base, perPellet, pelletRange, rpm: getEffectiveRPM(weapon, settings.rpmMode), damage, htk, ttk, hitMultiplier, classMultiplier, armorMultiplier, reason: base === null ? 'range' : damage === null ? 'pellets' : ttk === null ? 'timing' : null };
}
