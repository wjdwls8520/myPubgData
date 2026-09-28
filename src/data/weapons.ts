import data from "./weapons.json";
import curves from "./ballistics.json";
import source from "./source.json";
import type { Ballistics, WeaponClass } from "../domain/types";
export interface Weapon {
  id: string;
  name: string;
  category: string;
  damage: number;
  rpm: number;
  referenceId: string;
  weaponClass: WeaponClass;
  pellets: number;
  ammo: string;
  color: string;
  image: string;
}
// JSON is validated by the data regression test before a release.
export const weapons = data as Weapon[];
export const ballistics = curves as Record<string, Ballistics>;
export const dataSource = source;
export const categories = [
  ["SG", "SG"],
  ["SMG", "SMG"],
  ["AR", "AR"],
  ["LMG", "LMG"],
  ["DMR", "DMR"],
  ["SR", "SR"],
  ["PISTOL", "권총"],
] as const;
