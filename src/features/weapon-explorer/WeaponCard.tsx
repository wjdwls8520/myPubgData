import { ammoLabel, categoryLabels, firingLabels, weaponLabel } from '../../utils/labels';
import { ArrowUpRight, Crosshair, Package, Plus, Check } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Weapon } from '../../domain/weapon/schema';
import type { DamageResult } from '../../domain/damage/calculateDamage';
import type { ExplorerState } from '../../utils/urlState';
import { metric, number } from '../../utils/format';
export function WeaponCard({ weapon, result, state, update }: { weapon: Weapon; result: DamageResult; state: ExplorerState; update: (patch: Partial<ExplorerState>) => void }) {
  const [params] = useSearchParams();
  const active = state.weapon === weapon.id;
  const compared = state.compare === weapon.id;
  return <article className={`weapon-card ${active ? 'selected' : ''} ${compared ? 'compared' : ''}`}>
    <button className="card-main" aria-label={`${weaponLabel(weapon)} 선택`} aria-pressed={active} onClick={() => update({ weapon: weapon.id, compare: state.compare === weapon.id ? '' : state.compare })}>
      <div className="card-top"><span className="category-badge">{categoryLabels[weapon.category]}</span><span className="card-ammo">{ammoLabel(weapon.ammoType)}</span>{weapon.carePackage && <Package size={15} className="package-icon" aria-label="보급 전용"/>}</div>
      <div className="weapon-identity"><div className="weapon-symbol" aria-hidden="true"><Crosshair size={38} strokeWidth={1}/><span>{categoryLabels[weapon.category]}</span></div><div><h3>{weaponLabel(weapon)}</h3><p>{weapon.status === 'archived' ? '보관 데이터' : firingLabels[weapon.firing.kind]} <span>· {result.rpm ?? '—'} RPM</span></p></div>{active && <span className="selected-marker"><Check size={13}/></span>}</div>
      <div className="card-metrics">{(['damage', 'htk', 'ttk'] as const).map(type => <div key={type} className={state.display === type ? 'emphasis' : ''}><span>{type === 'damage' ? '데미지' : type === 'htk' ? '필요 탄수' : '처치 시간'}</span><strong>{metric(result[type], type)}</strong></div>)}</div>
    </button>
    <div className="card-bottom"><span>기본 {number(weapon.baseDamage)} <span className="muted">/ 현재 {number(result.base)}</span></span><div><button className={compared ? 'compare-selected' : ''} aria-label={`${weaponLabel(weapon)} 비교 ${compared ? '해제' : '추가'}`} disabled={active} onClick={() => update({ compare: compared ? '' : weapon.id })}>{compared ? <Check size={13}/> : <Plus size={13}/>} 비교</button><Link aria-label={`${weaponLabel(weapon)} 상세`} to={`/weapons/${weapon.slug}?${params}`}><ArrowUpRight size={15}/></Link></div></div>
    {result.reason === 'range' && <p className="card-note">측정 범위 {weapon.measuredRange.min}–{weapon.measuredRange.max}m</p>}{result.reason === 'pellets' && <p className="card-note">최대 {weapon.projectile.pelletCount}펠릿 · 명중 수를 줄여주세요</p>}
    {result.pelletRange && <p className="card-note">1–{weapon.projectile.pelletCount}펠릿: {number(result.pelletRange[0])}–{number(result.pelletRange[1])} 데미지</p>}
    {result.reason === 'timing' && <p className="card-note">추가 작동 시간 미확인 · TTK 계산 불가</p>}
  </article>;
}
