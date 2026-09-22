import { useEffect, useState } from 'react';
import type { WeaponRepository } from '../domain/weapon/repository';
import type { DamageRules, Metadata, Weapon, WeaponPatch } from '../domain/weapon/schema';
export interface Dataset { weapons: Weapon[]; rules: DamageRules; patches: WeaponPatch[]; metadata: Metadata }
export function useDataset(repository: WeaponRepository) {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([repository.getWeapons(), repository.getRules(), repository.getPatches(), repository.getMetadata()])
      .then(([weapons, rules, patches, metadata]) => { if (!cancelled) setData({ weapons, rules, patches, metadata }); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : '데이터를 읽을 수 없습니다.'); });
    return () => { cancelled = true; };
  }, [repository]);
  return { data, error };
}
