import { z } from 'zod';
import ar from '../weapons/ar.json';
import lmg from '../weapons/lmg.json';
import smg from '../weapons/smg.json';
import dmr from '../weapons/dmr.json';
import sr from '../weapons/sr.json';
import shotgun from '../weapons/shotgun.json';
import handgun from '../weapons/handgun.json';
import parts from '../multipliers/body-parts.json';
import classes from '../multipliers/weapon-classes.json';
import armor from '../multipliers/armor.json';
import bolts from '../timing/bolt.json';
import normalObservations from '../timing/normal-observations.json';
import history from '../patches/weapon-history.json';
import metadata from '../metadata.json';
import { bodyIds, bodyPartSchema, boltSchema, metadataSchema, multiplierSchema, patchSchema, weaponSchema } from '../../domain/weapon/schema';
import type { DamageRules } from '../../domain/weapon/schema';
import type { WeaponRepository } from '../../domain/weapon/repository';

export class JsonWeaponRepository implements WeaponRepository {
  private load() {
    const weapons = z.array(weaponSchema).parse([...ar, ...lmg, ...smg, ...dmr, ...sr, ...shotgun, ...handgun]);
    if (new Set(weapons.map(w => w.id)).size !== weapons.length) throw new Error('Duplicate weapon IDs');
    return weapons;
  }
  async getWeapons() { return this.load(); }
  async getWeapon(id: string) { return this.load().find(w => w.id === id) ?? null; }
  async getRules(): Promise<DamageRules> {
    const bodyParts = z.array(bodyPartSchema).length(bodyIds.length).parse(parts);
    if (new Set(bodyParts.map(p => p.id)).size !== bodyIds.length) throw new Error('Duplicate body part');
    const parsedBolts = boltSchema.parse(bolts);
    const observations = z.record(z.string(), z.tuple([z.number().positive().finite(), z.number().int().min(2)])).parse(normalObservations);
    for (const [id, [ttk, htk]] of Object.entries(observations)) {
      const weapon = this.load().find(w => w.id === id);
      if (!weapon || weapon.firing.normalInterval === null || Math.abs(weapon.firing.normalInterval - ttk / (htk - 1)) > Number.EPSILON) throw new Error(`Normal timing observation mismatch: ${id}`);
    }
    for (const weapon of this.load()) if (weapon.firing.kind === 'bolt' && !parsedBolts[weapon.firing.timingId]) throw new Error('Missing bolt timing');
    return { bodyParts, classes: multiplierSchema.parse(classes), armor: z.tuple([z.literal(1), z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)]).parse(armor), bolts: parsedBolts, health: metadataSchema.parse(metadata).health };
  }
  async getPatches(weaponId?: string) {
    const patches = z.array(patchSchema).parse(history);
    const ids = new Set(this.load().map(w => w.id));
    if (patches.some(p => !ids.has(p.weaponId))) throw new Error('Unknown patch weapon');
    return weaponId ? patches.filter(p => p.weaponId === weaponId) : patches;
  }
  async getMetadata() { return metadataSchema.parse(metadata); }
}
