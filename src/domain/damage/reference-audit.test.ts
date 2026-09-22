import { describe, expect, it } from 'vitest';
import observations from '../../../docs/research-observations.json';
import { JsonWeaponRepository } from '../../data/repositories/weaponRepository';
import { calculateDamage } from './calculateDamage';
import type { DamageSettings } from './calculateDamage';

describe('independent public display comparisons', () => {
  it('matches all 53 public body tables within published base/output rounding precision', async () => {
    const repository = new JsonWeaponRepository();
    const weapons = await repository.getWeapons();
    const rules = await repository.getRules();
    const halfDisplayUnit = .05;
    for (const page of observations.pages) {
      const weapon = weapons.find(w => w.id === page.slug);
      if (!weapon) throw new Error(page.slug);
      const state: DamageSettings = { distance: weapon.measuredRange.min, helmet: 2, vest: 2, pellets: 1, timing: 'perfect', clickIntervalMs: 200, scope: '4x', rpmMode: 'default' };
      for (const row of page.tables[1]?.slice(1) ?? []) {
        const part = rules.bodyParts.find(p => p.name.toLowerCase() === row[0]?.toLowerCase());
        if (!part) throw new Error(`Unknown reference row ${page.slug}: ${row[0]}`);
        const result = calculateDamage(weapon, part.id, state, rules);
        const expected = Number(row[5]);
        const tolerance = halfDisplayUnit * result.hitMultiplier * result.classMultiplier * result.armorMultiplier + halfDisplayUnit;
        expect(result.perPellet).not.toBeNull();
        expect(Math.abs((result.perPellet ?? 0) - expected), `${page.slug} ${part.id}`).toBeLessThanOrEqual(tolerance + Number.EPSILON * 1000);
      }
    }
  });
  it('matches public chest/head distance tables within known display precision, without reverse engineering raw values', async () => {
    const repository = new JsonWeaponRepository();
    const weapons = await repository.getWeapons();
    const rules = await repository.getRules();
    for (const page of observations.pages) {
      const weapon = weapons.find(w => w.id === page.slug);
      if (!weapon) throw new Error(page.slug);
      for (const row of page.tables[0]?.slice(1) ?? []) {
        const distance = Number(row[0]?.replace(' m', ''));
        for (const [body, column] of [['chest', 2], ['head', 3]] as const) {
          const result = calculateDamage(weapon, body, { distance, helmet: 0, vest: 0, pellets: 1, timing: 'perfect', clickIntervalMs: 200, scope: '4x', rpmMode: 'default' }, rules);
          const tolerance = .05 * result.hitMultiplier * result.classMultiplier + .05 + 1e-10;
          expect(Math.abs((result.damage ?? 0) - Number(row[column])), `${page.slug} ${distance}m ${body}`).toBeLessThanOrEqual(tolerance);
        }
      }
    }
  });
});
