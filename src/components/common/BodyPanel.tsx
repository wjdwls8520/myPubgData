import { bodyLabels, weaponLabel } from '../../utils/labels';
import { Crosshair, ExternalLink } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { BodyId, DamageRules, Weapon } from '../../domain/weapon/schema';
import type { ExplorerState } from '../../utils/urlState';
import { calculateDamage } from '../../domain/damage/calculateDamage';
import { metric, metricLabels } from '../../utils/format';
const shapes: { id: BodyId; d: string }[] = [
  { id: 'head', d: 'M91 15 Q110 2 129 15 L132 37 123 51 97 51 88 37Z' },
  { id: 'neck', d: 'M99 54H121L124 69H96Z' },
  { id: 'clavicle', d: 'M94 72H126L144 82 137 94H83L76 82Z' },
  { id: 'chest', d: 'M84 97H136L137 128 111 137 83 128Z' },
  { id: 'upper-stomach', d: 'M84 132L110 141 136 132 133 154H87Z' },
  { id: 'lower-stomach', d: 'M87 158H133L135 178H85Z' },
  { id: 'pelvis', d: 'M84 182H136L142 205 123 224 110 211 97 224 78 205Z' },
  { id: 'upper-arm', d: 'M73 83L81 98 69 128 55 132 53 118 61 88Z M147 83L139 98 151 128 165 132 167 118 159 88Z' },
  { id: 'forearm', d: 'M54 136L68 133 63 173 49 190 40 183Z M166 136L152 133 157 173 171 190 180 183Z' },
  { id: 'hand', d: 'M39 187L48 195 43 216 30 222 27 210Z M181 187L172 195 177 216 190 222 193 210Z' },
  { id: 'thigh', d: 'M77 211L96 230 106 223 103 277 80 277 74 241Z M143 211L124 230 114 223 117 277 140 277 146 241Z' },
  { id: 'calf', d: 'M80 282H102L97 323 91 344H78L75 321Z M140 282H118L123 323 129 344H142L145 321Z' },
  { id: 'foot', d: 'M77 349H91L94 366 86 374 63 374 62 366Z M143 349H129L126 366 134 374 157 374 158 366Z' },
];
export function BodyPanel({ weapon, state, rules, update }: { weapon: Weapon; state: ExplorerState; rules: DamageRules; update: (patch: Partial<ExplorerState>) => void }) {
  const [params] = useSearchParams();
  const selected = calculateDamage(weapon, state.body, state, rules);
  return <section className="body-panel panel" aria-labelledby="body-heading"><div className="section-heading"><span><Crosshair size={16}/> 부위별 분석</span><span className="micro">{state.distance} m</span></div><div className="body-title"><div><span className="eyebrow">선택한 무기</span><h2 id="body-heading">{weaponLabel(weapon)}</h2></div><Link className="icon-button" aria-label={`${weaponLabel(weapon)} 상세 보기`} to={`/weapons/${weapon.slug}?${params}`}><ExternalLink size={17}/></Link></div><div className="body-stage"><div className="body-grid"/><svg viewBox="0 0 220 390" role="img" aria-label="13개 신체 부위 도식. 아래 목록에서 부위를 선택할 수 있습니다."><line x1="110" y1="0" x2="110" y2="390" stroke="currentColor" strokeDasharray="3 7" opacity=".12"/>{shapes.map(shape => <path key={shape.id} d={shape.d} className={shape.id === state.body ? 'body-selected' : 'body-part'}/>)}</svg><div className="body-callout"><span>{bodyLabels[state.body]}</span><strong>{metric(selected[state.display], state.display)}</strong><small>{metricLabels[state.display]} · 추정값</small></div><span className="body-coordinates">정면 / 01</span></div><div className="body-list-heading"><span>피격 부위</span><span>{metricLabels[state.display]}</span></div><div className="body-list">{rules.bodyParts.map(part => {
    const result = calculateDamage(weapon, part.id, state, rules);
    return <button key={part.id} onClick={() => update({ body: part.id })} aria-pressed={state.body === part.id}><span><i className={`armor-dot ${part.armor}`}/>{bodyLabels[part.id]}</span><strong>{metric(result[state.display], state.display)}</strong></button>;
  })}</div><div className="body-legend"><span><i className="armor-dot helmet"/> 헬멧</span><span><i className="armor-dot vest"/> 조끼</span><span><i className="armor-dot none"/> 비보호</span></div></section>;
}
