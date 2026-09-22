import { bodyLabels, categoryLabels, weaponLabel } from '../../utils/labels';
import { Search, ArrowDownWideNarrow, X, Info } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { categories } from '../../domain/weapon/schema';
import { calculateDamage } from '../../domain/damage/calculateDamage';
import type { Dataset } from '../../hooks/useDataset';
import { parseUrlState, updateUrlState } from '../../utils/urlState';
import type { ExplorerState, Sort } from '../../utils/urlState';
import { metricLabels } from '../../utils/format';
import { Controls } from '../../components/common/Controls';
import { BodyPanel } from '../../components/common/BodyPanel';
import { WeaponCard } from './WeaponCard';
import { Comparison } from '../weapon-comparison/Comparison';
export function Explorer({ data }: { data: Dataset }) {
  const [params, setParams] = useSearchParams();
  const maxDistance = Math.max(...data.weapons.map(w => w.measuredRange.max));
  const state = parseUrlState(params, maxDistance);
  const update = (patch: Partial<ExplorerState>) => setParams(updateUrlState(new URLSearchParams(window.location.search), patch), { replace: true });
  const selected = data.weapons.find(w => w.id === state.weapon);
  const compared = data.weapons.find(w => w.id === state.compare && w.id !== state.weapon);
  const results = data.weapons.map(weapon => ({ weapon, result: calculateDamage(weapon, state.body, state, data.rules) }));
  const visible = results.filter(({ weapon }) => (state.archived || weapon.status === 'active') && (state.category === 'ALL' || state.category === weapon.category) && weaponLabel(weapon).toLowerCase().includes(state.search.toLowerCase())).sort((a, b) => {
    if (state.sort === 'type') return categories.indexOf(a.weapon.category) - categories.indexOf(b.weapon.category) || a.weapon.name.localeCompare(b.weapon.name);
    if (state.sort === 'ammo') return (a.weapon.ammoType ?? 'zzz').localeCompare(b.weapon.ammoType ?? 'zzz') || a.weapon.name.localeCompare(b.weapon.name);
    const left = a.result[state.sort]; const right = b.result[state.sort];
    if (left === null) return right === null ? a.weapon.name.localeCompare(b.weapon.name) : 1;
    if (right === null) return -1;
    return (state.sort === 'damage' ? right - left : left - right) || a.weapon.name.localeCompare(b.weapon.name);
  });
  return <><div className="page-heading"><div><div className="eyebrow">배틀그라운드 / 무기 통계</div><h1>무기 분석실<span className="heading-dot">.</span></h1><p>거리와 방어구를 설정하고, 같은 조건에서 비교하세요.</p></div><div className="dataset-stamp"><span className="status-dot"/> 패치 {data.metadata.version}<small>{data.weapons.length} 종 무기 / {categories.length}개 분류</small></div></div>
    <div className="notice"><Info size={15}/><span>공개 표본 기반 추정값입니다. 측정 범위 밖은 <b>—</b>로 표시합니다.</span><Link to="/methodology">계산 기준 ↗</Link></div>
    <div className="workspace"><Controls state={state} update={update} maxDistance={maxDistance} rules={data.rules}/><section className="arsenal" aria-label="무기 목록"><div className="arsenal-toolbar"><div className="search-field"><Search size={17}/><input aria-label="무기 검색" placeholder="무기 이름 검색" value={state.search} onChange={e => update({ search: e.target.value })}/>{state.search && <button aria-label="검색 지우기" onClick={() => update({ search: '' })}><X size={14}/></button>}</div><div className="metric-switch">{(['damage', 'htk', 'ttk'] as const).map(display => <button key={display} title={display === 'damage' ? '데미지' : display === 'htk' ? '처치 필요 탄수 (HTK)' : '처치 시간 (TTK)'} aria-pressed={state.display === display} onClick={() => update({ display })}>{metricLabels[display]}</button>)}</div></div><div className="category-tabs" aria-label="무기 분류">{(['ALL', ...categories] as const).map(category => <button key={category} aria-pressed={state.category === category} onClick={() => update({ category })}>{category === 'ALL' ? '전체' : categoryLabels[category]}</button>)}</div><div className="list-meta"><span><strong>{visible.length}</strong>종 무기 <span className="divider">/</span> {bodyLabels[state.body]}</span><label><ArrowDownWideNarrow size={14}/><span className="sr-only">정렬</span><select aria-label="무기 정렬" value={state.sort} onChange={e => update({ sort: e.target.value as Sort })}><option value="type">분류순</option><option value="damage">데미지 높은 순</option><option value="ammo">탄약순</option><option value="htk">처치 탄수 적은 순</option><option value="ttk">처치 시간 짧은 순</option></select></label></div>
    {!selected && <div className="error" role="alert">선택한 무기를 찾을 수 없습니다. 목록에서 다시 선택하세요.</div>}{state.compare && !compared && <div className="error" role="alert">비교 무기가 없거나 동일한 무기입니다. <button onClick={() => update({ compare: '' })}>비교 해제</button></div>}
    {selected && compared && <Comparison first={selected} second={compared} state={state} rules={data.rules} update={update}/>}
    <div className="weapon-grid">{visible.map(({ weapon, result }) => <WeaponCard key={weapon.id} weapon={weapon} result={result} state={state} update={update}/>)}</div>{visible.length === 0 && <div className="empty"><Search size={30}/><h2>검색 결과가 없습니다</h2><button className="primary-button" onClick={() => update({ search: '', category: 'ALL' })}>필터 초기화</button></div>}<label className="archive-toggle"><input type="checkbox" checked={state.archived} onChange={e => update({ archived: e.target.checked })}/> 삭제된 무기 {data.weapons.filter(w => w.status === 'archived').length}종의 보관 데이터 포함</label></section>{selected && <BodyPanel weapon={selected} state={state} rules={data.rules} update={update}/>}</div></>;
}
