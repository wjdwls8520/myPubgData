import type { DamageRules, Metadata, Weapon, WeaponPatch } from './schema';
export interface WeaponRepository {
  getWeapons(): Promise<Weapon[]>;
  getWeapon(id: string): Promise<Weapon | null>;
  getRules(): Promise<DamageRules>;
  getPatches(weaponId?: string): Promise<WeaponPatch[]>;
  getMetadata(): Promise<Metadata>;
}
