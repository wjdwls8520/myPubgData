import type { BodyId, Category, Weapon } from '../domain/weapon/schema';

export const bodyLabels: Record<BodyId, string> = {
  head: '머리', neck: '목', clavicle: '쇄골', chest: '가슴',
  'upper-stomach': '상복부', 'lower-stomach': '하복부', pelvis: '골반',
  'upper-arm': '위팔', forearm: '아래팔', hand: '손', thigh: '허벅지', calf: '종아리', foot: '발',
};
export const categoryLabels: Record<Category, string> = {
  AR: 'AR', LMG: 'LMG', SMG: 'SMG', DMR: 'DMR', SR: 'SR', SHOTGUN: '산탄총', HANDGUN: '권총',
};
export const firingLabels: Record<Weapon['firing']['kind'], string> = {
  auto: '자동', single: '단발', burst: '점사', bolt: '볼트액션', pump: '펌프액션',
};
export const timingLabels = { perfect: '최적 간격', normal: '일반 사격', custom: '직접 설정' };
export function ammoLabel(ammo: string | null) {
  if (ammo === null) return '미확인';
  return ammo.replace('12 Gauge slug', '12게이지 슬러그').replace('12 Gauge', '12게이지').replace('.300 Magnum', '.300 매그넘');
}
export function weaponLabel(weapon: Weapon) { return weapon.id === 'beryl' ? 'Beryl M762' : weapon.name; }
export function patchDateLabel(value: string) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const match = /^(\d{1,2}) (\w+) (\d{4})$/.exec(value);
  if (!match) return '날짜 미확인';
  const month = months.findIndex(m => m === match[2]);
  return month < 0 ? '날짜 미확인' : `${match[3]}.${String(month + 1).padStart(2, '0')}.${match[1]?.padStart(2, '0')}`;
}
