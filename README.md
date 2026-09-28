# FIELD DECK · 1차 개발

확정 HTML 시안을 React + TypeScript + Tailwind + Vite로 이식한 프로젝트입니다.

## 실행

```sh
npm install
npm run dev
npm run build
npm test
npm run test:data
```

테스트는 설치된 Microsoft Edge를 사용합니다. 다른 OS에서는 `playwright.config.ts`의 `channel`을 바꾸거나 Playwright Chromium을 설치해 사용하세요.

## 이번 이식 검증

- TypeScript strict 타입 검사 통과.
- 이 실행 환경의 Node 하위 프로세스 파이프 제한(EPERM) 때문에 표준 Vite/esbuild 빌드와 Playwright CLI 전체 실행은 검증하지 못했습니다.
- 별도 in-process TypeScript + Vite + Tailwind 검증 빌드는 성공했고, 생성된 `dist/`를 앱 브라우저에서 직접 확인했습니다.
- 실제 드래그·좌우 교체·분류 전환·앞면 복귀를 확인했습니다. 현재 총기 카드는 중복 없이 53개입니다.
- 데이터 검사: 모든 실측 포인트와 33,072개 부위/방어구/거리 조합, 점사 간격, 쌍열 재장전, 펠릿 경계값을 검증합니다.
- 상세 UI: 거리 레인지바, 인체 피해 표시, 32px 헤더 접힘/복원, 비교 스크롤 연동을 앱 브라우저에서 확인했습니다.
- `tests/` 회귀 테스트는 일반 개발 환경에서 `npm test`로 실행할 수 있도록 포함했습니다.

## 구조와 수정 원칙

- `src/components/WeaponCard.tsx`: 재사용 카드 UI. 무기 ID를 key로 사용해 이동 중에도 같은 DOM을 유지합니다.
- `src/armory/controller.ts`: 배치, 드래그, 호버, 비교 슬롯, 글꼴 전환. React가 소유한 콘텐츠는 다시 만들지 않습니다.
- `src/armory/types.ts`: 카드 상태와 위치의 타입.
- `src/data/weapons.json`: 무기 53종의 표시 정보. `ballistics.json`에 거리별 실측 샘플·발사 간격, `source.json`에 버전·출처를 보존합니다.
- `src/domain/damage.ts`: 부위·방어구·거리·펠릿 피해와 HTK/TTK 순수 계산 함수. 표시 반올림과 실제 계산을 분리합니다.
- `src/components/WeaponDetails.tsx`, `DistanceControl.tsx`, `BodyDiagram.tsx`: 상세 정보와 직접 작성한 인체 SVG.
- `src/armory/detailScroll.ts`: 비교 스크롤 연동. 상대 카드에서 발생한 미러 스크롤 이벤트는 무시해 순환을 막습니다.
- `src/details.css`: 상세 내부 스크롤과 접히는 헤더만 담당합니다.
- `src/styles.css`: 확정된 디자인과 애니메이션. Tailwind의 reset은 사용하지 않아 기존 브라우저 기본값까지 보존합니다.
- `tests/armory.spec.ts`: 카드 개체 연속성, 좌우 교체, 카테고리 전환, 폰트 전환 회귀 테스트.

애니메이션 중 매 프레임 React를 갱신하지 않고 컨트롤러가 위치만 변경합니다. 같은 카드를 다른 부모로 옮기거나 조건부 렌더링하지 마세요.
CSS 상태 선택자는 디자인용, TypeScript의 Card.state는 동작용으로 컨트롤러에서 함께 갱신합니다.

## 범위와 주의사항

피해·연사속도는 [pubgstatistics.com](https://pubgstatistics.com/weapons)의 PUBG 43.1 데이터 스냅샷(게시 갱신 2026-09-15, 확인 2026-09-27)입니다. 공식 KRAFTON 데이터 덤프가 아닌 경기 실측 기반 자료입니다. 각 무기의 원 측정 패치도 보존하며 자동 업데이트는 하지 않습니다.

헬멧은 머리·목, 조끼는 몸통·골반에만 적용합니다. 실측 사이만 선형 보간하고 최종 실측 거리를 넘으면 미확인으로 표시합니다. RPM은 발사 간격에서 계산해 10단위로 표시하며, 단발·점사는 최적 간격, 볼트액션은 4배율 기준이 기본입니다. 상세 설정으로 변경할 수 있습니다.

체력 100의 첫 명중 시점을 TTK=0으로 계산합니다. 일반 탄창 재장전·탄속·방어구 파손·산탄 분산은 모델링하지 않습니다. 쌍열 산탄총 재장전과 점사 내부 간격은 반영합니다. 산탄의 전탄 모드는 모든 펠릿이 같은 부위에 명중한 이론값이며, 펠릿 1개 모드에서는 TTK를 표시하지 않습니다.

레퍼런스의 전체 53종을 수록하기 위해 누락 무기 6종과 LMG 분류를 추가했습니다. 연막권총·판처파우스트·투척물은 제외합니다. 원본 시안은 과거 디자인 확인용으로만 남기며 데이터 기준으로 사용하지 마세요.
이미지는 시안과 동일한 외부 URL, 폰트는 Google Fonts를 사용합니다. 정식 배포 전 이미지 이용 권한과 안정적인 에셋 공급 경로를 확인해야 합니다.
확정 원본은 상위 폴더의 pubg-card-armory-concept.html에 보존했습니다.
