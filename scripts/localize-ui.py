from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def edit(file, replacements, imports=''):
    p = ROOT/file
    s = p.read_text(encoding='utf-8')
    for old, new in replacements:
        if old not in s:
            print('No match:', file, old[:60])
        s = s.replace(old,new)
    if imports: s = imports+'\n'+s
    p.write_text(s,encoding='utf-8')

edit('src/main.tsx',[('<BrowserRouter>','<BrowserRouter useTransitions={false}>')])
edit('src/utils/format.ts',[("`${number(value, 3)}s`","`${number(value, 3)}초`"),("damage: 'DMG'","damage: '데미지'")])
edit('src/components/common/Controls.tsx',[
 ('>meters<','>미터<'),('`Lv.${level}`','`${level}레벨`'),('{part.name}','{bodyLabels[part.id]}'),
 ('Perfect · 이론 간격','최적 간격 · 이론값'),('Normal · 관찰 기반','일반 사격 · 관찰값'),('Custom · 직접 설정','직접 설정'),("? 'No ADS' : scope","? '비조준' : scope"),
],"import { bodyLabels } from '../../utils/labels';")
edit('src/components/common/BodyPanel.tsx',[
 ('{weapon.name}','{weaponLabel(weapon)}'),('${weapon.name}','${weaponLabel(weapon)}'),
 ('SELECTED WEAPON','선택한 무기'),('FRONT / 01','정면 / 01'),('HIT ZONE','피격 부위'),
 ("{rules.bodyParts.find(p => p.id === state.body)?.name}",'{bodyLabels[state.body]}'),('{part.name}','{bodyLabels[part.id]}'),
 ('{state.distance} M','{state.distance} m'),
],"import { bodyLabels, weaponLabel } from '../../utils/labels';")
edit('src/features/weapon-explorer/WeaponCard.tsx',[
 ('{weapon.name}','{weaponLabel(weapon)}'),('${weapon.name}','${weaponLabel(weapon)}'),
 ('{weapon.category}','{categoryLabels[weapon.category]}'),("{weapon.ammoType ?? '탄약 미확인'}",'{ammoLabel(weapon.ammoType)}'),('보급 무기','보급 전용'),
 ('weapon.firing.kind.toUpperCase()','firingLabels[weapon.firing.kind]'),
 ("type === 'damage' ? 'DAMAGE' : type.toUpperCase()","type === 'damage' ? '데미지' : type === 'htk' ? '필요 탄수' : '처치 시간'"),
 ('BASE {number','기본 {number'),('/ NOW {number','/ 현재 {number'),('} DMG','} 데미지'),
],"import { ammoLabel, categoryLabels, firingLabels, weaponLabel } from '../../utils/labels';")
edit('src/features/weapon-explorer/Explorer.tsx',[
 ('BATTLEGROUNDS / BALLISTICS','배틀그라운드 / 무기 통계'),('PATCH {data.metadata.version}','패치 {data.metadata.version}'),
 ('WEAPONS / {categories.length} CLASSES','종 무기 / {categories.length}개 분류'),
 ("category === 'ALL' ? '전체' : category","category === 'ALL' ? '전체' : categoryLabels[category]"),
 ('</strong> weapons','</strong>종 무기'),('{state.body}','{bodyLabels[state.body]}'),
 ('HTK 낮은 순','처치 탄수 적은 순'),('TTK 짧은 순','처치 시간 짧은 순'),
],"import { bodyLabels, categoryLabels } from '../../utils/labels';")
edit('src/features/weapon-comparison/Comparison.tsx',[
 ('{first.name}','{weaponLabel(first)}'),('{second.name}','{weaponLabel(second)}'),('<span>vs</span>','<span>대</span>'),
 ('헬멧 Lv.{state.helmet}','헬멧 {state.helmet}레벨'),('조끼 Lv.{state.vest}','조끼 {state.vest}레벨'),('{state.body}','{bodyLabels[state.body]}'),('{state.timing}','{timingLabels[state.timing]}'),
 ('{type.toUpperCase()}',"{type === 'damage' ? '데미지' : type === 'htk' ? '처치 필요 탄수 (HTK)' : '처치 시간 (TTK)'}"),
 ('<th>RPM</th>','<th>분당 발사속도 (RPM)</th>'),('<th>Ammo</th>','<th>탄약</th>'),("{first.ammoType ?? '미확인'}",'{ammoLabel(first.ammoType)}'),("{second.ammoType ?? '미확인'}",'{ammoLabel(second.ammoType)}'),
 ('13개 부위 비교 · DMG / HTK / TTK','13개 부위 비교 · 데미지 / 필요 탄수 / 처치 시간'),('{part.name}','{bodyLabels[part.id]}'),
],"import { ammoLabel, bodyLabels, timingLabels, weaponLabel } from '../../utils/labels';")
edit('src/features/weapon-detail/DamageChart.tsx',[
 ('${weapon.name}','${weaponLabel(weapon)}'),('name="Base"','name="기본 데미지"'),('name="Chest"','name="가슴"'),('name="Head"','name="머리"'),
],"import { weaponLabel } from '../../utils/labels';")
edit('src/features/weapon-detail/Detail.tsx',[
 ('{weapon.name}','{weaponLabel(weapon)}'),('WEAPON DOSSIER / {weapon.category}','무기 상세 / {categoryLabels[weapon.category]}'),("{weapon.ammoType ?? '탄약 미확인'}",'{ammoLabel(weapon.ammoType)}'),('{weapon.firing.kind.toUpperCase()}','{firingLabels[weapon.firing.kind]}'),
 ('보급 무기','보급 전용'),('BASE DAMAGE','기본 데미지'),('FIRE RATE','분당 발사속도'),('MEASURED RANGE','측정 거리'),('MUZZLE VELOCITY','총구 속도'),('LINEAR MODEL','선형 보간'),
 ('거리별 피해','거리별 데미지 감소'),('<th>Base</th>','<th>기본</th>'),('<th>Chest</th>','<th>가슴</th>'),('<th>Head</th>','<th>머리</th>'),
 ('<th>Hit ×</th>','<th>부위 배율</th>'),('<th>Class ×</th>','<th>무기 배율</th>'),('<th>Armor ×</th>','<th>방어구 배율</th>'),('<th>DMG</th>','<th>데미지</th>'),('<th>HTK</th>','<th>필요 탄수 (HTK)</th>'),('<th>TTK</th>','<th>처치 시간 (TTK)</th>'),
 ('{part.name}','{bodyLabels[part.id]}'),('{state.distance} M','{state.distance} m'),('} DMG','} 데미지'),('Head/Neck class 배율','머리·목 무기 배율'),('모든 ADS 선택','모든 조준 선택'),('패치 이력','패치 기록'),('} RECORDS','}건'),
],"import { ammoLabel, bodyLabels, categoryLabels, firingLabels, weaponLabel } from '../../utils/labels';")
edit('src/app/App.tsx',[
 ('PUBG WEAPON LAB','PUBG 무기 분석'),('>REFERENCE ','>참고 자료 '),('Independent PUBG analysis','독립 PUBG 무기 분석'),
 ('<p>{error}</p>','<p>무기 데이터 형식이 올바르지 않거나 불러올 수 없습니다.</p>'),
])
edit('src/app/Methodology.tsx',[
 ('DATA / METHODOLOGY','데이터 / 계산 기준'),('Normal:','일반 사격:'),('Perfect:','최적 간격:'),('Custom:','직접 설정:'),('Bolt:','볼트액션:'),('Shotgun:','산탄총:'),('모든 ADS 라벨','모든 조준 라벨'),
 ('53종을','{data.weapons.length}종을'),('게임 raw precision','게임 원시 정밀도'),
])
edit('index.html',[('FIELDNOTES / PUBG Weapon Lab','필드노트 / PUBG 무기 통계')])
