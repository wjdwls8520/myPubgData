import { beforeAll, describe, expect, it } from 'vitest';
import { JsonWeaponRepository } from '../../data/repositories/weaponRepository';
import type { DamageRules, Weapon } from '../weapon/schema';
import { weaponSchema } from '../weapon/schema';
import { calculateDamage } from './calculateDamage';
import type { DamageSettings } from './calculateDamage';
import { calculateDistanceDamage } from './calculateDistanceDamage';
import { calculateHTK } from './calculateHTK';
import { calculateTTK } from './calculateTTK';
import { calculateBurstTTK } from './calculateBurstTTK';
import { calculateBoltTTK } from './calculateBoltTTK';
import { calculateShotgunDamage } from './calculateShotgunDamage';

const repository = new JsonWeaponRepository();
let weapons: Weapon[];
let rules: DamageRules;
const settings: DamageSettings = { distance: 0, helmet: 2, vest: 2, pellets: 'all', timing: 'perfect', clickIntervalMs: 200, scope: '4x', rpmMode: 'default' };
function weapon(id: string) { const result = weapons.find(w => w.id === id); if (!result) throw new Error(id); return result; }
beforeAll(async () => { weapons = await repository.getWeapons(); rules = await repository.getRules(); });

describe('all JSON datasets', () => {
  it('validates 53 weapons, all categories, rules and patches', async () => {
    expect(weapons).toHaveLength(53);
    expect(new Set(weapons.map(w => w.category)).size).toBe(7);
    expect(rules.bodyParts).toHaveLength(13);
    expect(await repository.getPatches()).toHaveLength(196);
    expect((await repository.getMetadata()).version).toBe('43.1');
    expect(await repository.getWeapon('missing')).toBeNull();
  });
  it('rejects invalid order, duplicate distances, muzzle claims and negative timing', () => {
    const m = weapon('m416');
    expect(weaponSchema.safeParse({ ...m, falloff: [...m.falloff].reverse() }).success).toBe(false);
    expect(weaponSchema.safeParse({ ...m, falloff: [...m.falloff, m.falloff.at(-1)] }).success).toBe(false);
    expect(weaponSchema.safeParse({ ...weapon('o12'), baseDamage: 99 }).success).toBe(false);
    expect(weaponSchema.safeParse({ ...m, firing: { ...m.firing, rpm: -1 } }).success).toBe(false);
  });
  it('retains removed weapons as archived', () => expect(weapons.filter(w => w.status === 'archived')).toHaveLength(6));
});
describe('distance damage', () => {
  it('preserves exact samples and linearly interpolates without rounding', () => {
    expect(calculateDistanceDamage(weapon('m416'), 0)).toBe(40);
    expect(calculateDistanceDamage(weapon('m416'), 75)).toBe(39.5);
    expect(calculateDistanceDamage(weapon('m416'), 450)).toBe(30);
  });
  it('does not extrapolate either boundary', () => {
    expect(calculateDistanceDamage(weapon('m416'), 451)).toBeNull();
    expect(calculateDistanceDamage(weapon('o12'), 0)).toBeNull();
    expect(calculateDistanceDamage(weapon('o12'), 2)).toBe(98.7);
    expect(calculateDistanceDamage(weapon('win94'), 119)).toBeNull();
  });
  it.each([-1, NaN, Infinity])('rejects invalid distance %s', distance => expect(calculateDistanceDamage(weapon('m416'), distance)).toBeNull());
  it('accepts empty unknown data', () => expect(calculateDistanceDamage({ falloff: [] }, 0)).toBeNull());
});
describe('body and armor', () => {
  it('matches the public M416 muzzle / level 2 examples', () => {
    const chest = calculateDamage(weapon('m416'), 'chest', settings, rules);
    expect(chest.damage).toBeCloseTo(26.4);
    expect(chest.htk).toBe(4);
    expect(chest.ttk).toBeCloseTo(3 * 60 / 700);
    expect(calculateDamage(weapon('m416'), 'head', settings, rules).damage).toBeCloseTo(56.4);
  });
  it.each([0, 1, 2, 3] as const)('covers all armor levels %s', level => {
    expect(calculateDamage(weapon('m416'), 'head', { ...settings, helmet: level }, rules).damage).toBeCloseTo(94 * rules.armor[level]);
    expect(calculateDamage(weapon('m416'), 'chest', { ...settings, vest: level }, rules).damage).toBeCloseTo(44 * rules.armor[level]);
    expect(calculateDamage(weapon('m416'), 'hand', { ...settings, vest: level }, rules).damage).toBeCloseTo(10.8);
  });
  it('helmet protects neck; vest does not protect neck', () => {
    expect(calculateDamage(weapon('m416'), 'neck', { ...settings, helmet: 0, vest: 3 }, rules).damage).toBeCloseTo(70.5);
  });
  it('keeps Dragunov and LMG pelvis exceptions', () => {
    expect(calculateDamage(weapon('dragunov'), 'head', settings, rules).classMultiplier).toBe(2.8);
    expect(calculateDamage(weapon('rpd'), 'pelvis', settings, rules).classMultiplier).toBe(1);
    expect(calculateDamage(weapon('rpd'), 'chest', settings, rules).classMultiplier).toBe(1.05);
  });
  it('unknown range propagates through all metrics', () => {
    const result = calculateDamage(weapon('m416'), 'head', { ...settings, distance: 500 }, rules);
    expect([result.damage, result.htk, result.ttk]).toEqual([null, null, null]);
    expect(result.reason).toBe('range');
  });
});
describe('HTK and timing', () => {
  it('uses internal precision at kill boundaries', () => {
    expect(calculateHTK(25)).toBe(4);
    expect(calculateHTK(24.999999)).toBe(5);
    expect(calculateHTK(100)).toBe(1);
    expect(calculateHTK(0)).toBeNull();
    expect(calculateHTK(null)).toBeNull();
    expect(calculateHTK(Infinity)).toBeNull();
  });
  it('first hit is at zero', () => expect(calculateTTK(weapon('akm'), 1, settings, rules)).toBe(0));
  it('automatic cadence and MG3 alternate mode', () => {
    expect(calculateTTK(weapon('akm'), 4, settings, rules)).toBeCloseTo(.3);
    expect(calculateTTK(weapon('mg3'), 4, { ...settings, rpmMode: 'slow' }, rules)).toBeCloseTo(3 * 60 / 660);
    expect(calculateDamage(weapon('mg3'), 'chest', { ...settings, rpmMode: 'slow' }, rules).rpm).toBe(660);
  });
  it('custom single timing respects minimum cycle', () => {
    expect(calculateTTK(weapon('sks'), 4, { ...settings, timing: 'custom', clickIntervalMs: 500 }, rules)).toBe(1.5);
    expect(calculateTTK(weapon('sks'), 4, { ...settings, timing: 'custom', clickIntervalMs: 1 }, rules)).toBeCloseTo(3 * 60 / 350);
  });
  it('Normal single timing comes from observed multi-hit timing', () => expect(calculateTTK(weapon('sks'), 8, { ...settings, timing: 'normal' }, rules)).toBeCloseTo(1.78));
  it('counts burst boundaries separately, including exact burst ends', () => {
    expect(calculateBurstTTK(3, 3, .075, .2)).toBe(.15);
    expect(calculateBurstTTK(4, 3, .075, .2)).toBe(.35);
    expect(calculateBurstTTK(6, 3, .075, .2)).toBe(.5);
    expect(calculateBurstTTK(7, 3, .075, .2)).toBe(.7);
    expect(calculateBurstTTK(2, 2, .06, null)).toBe(.06);
    expect(calculateBurstTTK(3, 2, .06, null)).toBeNull();
  });
  it('custom click interval measures burst-start to burst-start', () => {
    expect(calculateTTK(weapon('mk47-mutant'), 5, { ...settings, timing: 'custom', clickIntervalMs: 200 }, rules)).toBeCloseTo(.4);
  });
  it('bolt timing depends on ADS, independently of rounded RPM', () => {
    expect(calculateTTK(weapon('awm'), 2, settings, rules)).toBe(2.57);
    expect(calculateTTK(weapon('awm'), 2, { ...settings, scope: 'none' }, rules)).toBe(2.11);
    expect(calculateBoltTTK(2, null)).toBeNull();
  });
  it('does not invent unknown reloading or double-shot pump time', () => {
    for (const id of ['s686', 'sawed-off', 'dbs']) expect(calculateTTK(weapon(id), 3, settings, rules)).toBeNull();
  });
});
describe('shotguns', () => {
  it('calculates pellet count and range', () => {
    expect(calculateShotgunDamage(20, 3, 9)).toBe(60);
    expect(calculateShotgunDamage(20, 0, 9)).toBe(0);
    expect(calculateShotgunDamage(20, 10, 9)).toBeNull();
    const one = calculateDamage(weapon('dbs'), 'chest', { ...settings, pellets: 1 }, rules);
    const all = calculateDamage(weapon('dbs'), 'chest', settings, rules);
    expect(all.damage).toBeCloseTo((one.damage ?? 0) * 9);
    expect(all.htk).toBe(1);
  });
  it('sawed-off has eight pellets and O12 one slug', () => {
    expect(weapon('sawed-off').projectile.pelletCount).toBe(8);
    const slug = calculateDamage(weapon('o12'), 'chest', { ...settings, distance: 2, pellets: 9 }, rules);
    expect(slug.damage).toBeCloseTo(98.7 * 1.1 * .9 * .6);
  });
});
