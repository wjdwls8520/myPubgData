# Reference research — 2026-09-22

## 조사 범위와 방법

https://pubgstatistics.com/weapons 의 모든 상세 링크를 열어 **53개 무기, 7개 분류**의 공개 수치 표를 조사했다. 패치 목록은 별도로 확인했다. 원본 JS/CSS/이미지/SVG를 사용하지 않는다. `research-observations.json`은 공개 표의 관찰 기록이며 앱의 결과 lookup table로 사용하지 않는다. 앱에는 기본 수치, 거리 표본, 배율만 저장한다.

사이트 표기 버전: 43.1, 업데이트 2026-09-15. 이는 참고 사이트의 데이터 버전이며 자체 게임 텔레메트리 검증을 뜻하지 않는다.

## 확인한 기능

| 기능 | 관찰 / 구현 결정 |
|---|---|
| 무기 목록 | AR, LMG, SMG, DMR, SR, SHOTGUN, HANDGUN; 탄약, 데미지, RPM, 보급 표시 |
| 거리 | 슬라이더; 무기마다 측정 구간이 다름. 범위 밖은 null, 끝값으로 연장하지 않음 |
| 방어구 | 헬멧/조끼 0–3. 피해 잔존 배율 1, 0.7, 0.6, 0.45 |
| 적용 부위 | 헬멧 head/neck; 조끼 clavicle/chest/upper stomach/lower stomach/pelvis; 팔다리 제외 |
| 부위 | 13부위. hit-area, class, armor를 분리 |
| 지표 | DMG, HTK, TTK; Type/Damage/Ammo/HTK/TTK 정렬; 두 무기 비교 |
| 상세 | 거리별 base/chest/head 표, 그래프, 배율, 부위 결과, 패치 이력 |
| 단발/점사 | Normal, Perfect, Custom. Custom은 클릭 빈도를 변경. 점사 내부와 다음 점사 시작은 별개 |
| 볼트/레버 | No ADS/2x/4x/6x/8x. Win94는 통합 스코프로 모든 ADS 선택 결과가 동일 |
| URL | explorer 무기 선택 링크 존재. 자체 앱은 모든 계산 조건을 query로 저장 |
| 삭제 무기 | Bizon, DP-28, Mosin-Nagant, P1911, QBU, R45는 보관 데이터로 분리 |

## 정확도와 미확인 항목

- 거리 표의 base는 **소수점 한 자리 표시값**. 원시 텔레메트리가 아니다. 예: M416 150m base 37.5 × 1.1 = 41.25지만 참고 chest 표시는 41.2. 반올림된 출력으로 raw 값을 역추정하지 않는다.
- O12의 첫 표본은 2m에서 98.7. 목록의 0m 99라는 표현을 정확한 muzzle raw 값으로 사용하지 않는다. Lynx의 첫 표본 2m, Mosin 30m, Win94 120m, R45 10m도 동일 원칙.
- 표본 사이 **선형 보간**은 자체 모델 선택이다. 게임 엔진 또는 참고 사이트 내부 보간 알고리즘으로 검증된 것이 아니다. 보간 오차 상한은 알려져 있지 않다.
- HTK는 계산 중 반올림하지 않고 ceil(HP/damage). PUBG 내부 반올림 규칙은 미확인. 표본 정밀도 때문에 경계에서 HTK 차이가 날 수 있다.
- 표기 RPM은 측정/반올림 값이며 TTK의 정확한 역수가 아닐 수 있다. AWM 20 RPM과 4x 2.57초 간격은 서로 일치하지 않는다. bolt timing을 별도 모델링한다.
- TTK는 첫 발 0초, 명중 보장, 동일 부위, 100HP, 탄환 비행시간/네트워크/방어구 파괴/재장전 제외. 필요한 재장전·작동 시간이 미확인인 특수 무기에는 결과를 제공하지 않는다.
- Normal의 공통 계산 규칙은 확인되지 않았다. 후속으로 단발/펌프 17종의 Normal TTK를 직접 관찰했다. 관찰된 TTK / (HTK − 1)을 근사 간격으로 사용하고 출처를 derived로 표시한다. 점사 Normal은 관찰된 다중 점사 TTK와 RPM 기반 내부 간격으로 경계 간격을 유도한다. 원시 타이밍이라고 주장하지 않는다. Perfect는 공개 RPM 기반 이론 모델, Custom은 사용자 입력 기반 모델이다.
- 총구 속도는 확인된 경우만 입력. 출처 없는 값은 null.

## 특수 규칙

- Dragunov head/neck class multiplier 2.80 (일반 DMR 2.35).
- LMG pelvis class multiplier 1.00, 다른 torso는 1.05. class별 단일 torso 상수로 합치면 안 됨.
- DBS/S1897/S686/S12K 9펠릿, Sawed-off 8펠릿. 공개 damage는 1펠릿 값, HTK는 전탄 명중을 전제하므로 의미가 다름. 자체 앱은 펠릿 명중 수를 명시.
- O12는 slug 1발. shotgun 카테고리만으로 9를 곱하지 않음.
- MG3 990/660 RPM 선택; Mk14, VSS 자동 모델. burst M16A4/Mk47 Mutant의 내부 interval과 burst boundary를 분리.
- S686/Sawed-off는 2발 뒤 재장전. DBS는 두 발 뒤 펌프 시간의 정확한 공개값을 확보하지 못함. 2발을 초과하는 TTK는 null.

## 직접 조작한 타이밍 관찰

아래 값은 2발 HTK의 화면 TTK에서 읽은 **반올림된 간격(초)**. 게임 원시값이 아니다.

| 무기 | No ADS | 2x | 4x | 6x | 8x |
|---|---:|---:|---:|---:|---:|
| AWM | 2.11 | 2.47 | 2.57 | 2.67 | 2.70 |
| Kar98k | 1.68 | 1.93 | 2.13 | 2.23 | 2.29 |
| M24 | 1.56 | 1.95 | 2.00 | 2.03 | 2.10 |
| Mosin-Nagant | 1.63 | 2.02 | 2.17 | 2.25 | 2.30 |
| Win94 | 0.94 | 1.34 | 1.34 | 1.34 | 1.34 |

Mk47: HTK 4에서 Perfect 0.19, Normal 0.20, Custom 300 clicks/min 0.26초. HTK 5 Custom 0.40초. 이는 클릭 주기가 burst 시작 간격에 작용함을 뒷받침한다. M16: HTK 9 Perfect 0.62, Normal 0.64초. SKS: HTK 8 Perfect 1.19, Normal 1.78초. DBS: HTK 2 Perfect 0.15, Normal 0.20초. 단일 공통 normal 상수를 추정해 적용하지 않는다.

## 공식 출처 교차 확인

- [39.1](https://pubg.com/en/news/9466?category=patch_notes): M416/AUG/VSS/SKS/SLR 변경 확인.
- [42.1](https://pubg.com/en/news/10179): 삭제 무기 6종을 공식 문서에서 확인. 참고 목록의 'July'와 패치 이력의 June가 불일치하므로 공식 패치 번호를 기준으로 기록.

전체 상세 페이지별 관찰값은 `research-observations.json`, 구축 현황은 `data-sources.md` 참조.

단발/펌프 Normal 관찰 원본 (TTK, HTK)은 `src/data/timing/normal-observations.json`에 보관했다. RPD 도입 및 735m/s는 https://pubg.com/en/news/10885?category=patch_notes 에서 교차 확인한다.
