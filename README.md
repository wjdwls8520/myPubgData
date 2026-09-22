# FIELDNOTES / PUBG Weapon Lab

React + strict TypeScript + Vite + React Router + Tailwind CSS 기반 독립 PUBG 무기 분석 앱입니다. 백엔드·DB·런타임 API 키가 필요하지 않습니다.

## 실행

```sh
npm install
npm run dev
```

기본 주소: http://127.0.0.1:5173/weapons

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run preview
```

Node.js 22.12+ 권장. 확인 환경은 Node 24입니다. 배포 시 `dist`를 제공하고 `/weapons/:slug` 같은 SPA 경로는 `index.html`로 fallback하도록 웹 서버를 설정하세요.

## 기능

7개 분류 53무기(현재 47, 보관 6), 거리·방어구·13부위 피해, DMG/HTK/TTK, 분류/검색/정렬, 같은 조건의 두 무기 비교, 상세 그래프와 표, 펠릿 수·단발/점사 타이밍·조준경·MG3 연사 모드, 패치 기록 196건. 설정은 URL query에 유지됩니다.

공개 표본 정밀도와 선형 보간에 기반한 **추정 모델**입니다. 게임 raw precision과 일치한다는 보장은 없습니다. 범위 밖 또는 미확인 데이터는 —입니다. 원본 사이트 코드·디자인 자산을 사용하지 않았습니다. 총기 이미지는 재사용하지 않고 분류 아이콘을 사용했습니다.

## 구조

```text
src/app                         앱 조립과 라우트
src/components/common           공통 조건 패널과 자체 제작 신체 도식
src/features/weapon-explorer    검색·분류·정렬·선택
src/features/weapon-comparison  두 무기 동일 조건 비교
src/features/weapon-detail      그래프·수치 표·패치 이력
src/domain/weapon               모델·Zod schema·repository interface
src/domain/damage               순수 계산 함수와 단위 테스트
src/data                        분류별 JSON·배율·타이밍·이력·출처
src/data/repositories           JsonWeaponRepository
src/hooks                       비동기 데이터 로딩
src/utils                       URL 검증·표시 형식
docs                            조사·모델·출처·계산·검증 보고서
```

`WeaponRepository`를 구현한 API 어댑터를 `main.tsx`에 주입하면 UI/계산 엔진을 유지하면서 Spring Boot API로 전환할 수 있습니다. repository는 Promise 계약을 사용하고 스키마 오류를 표시합니다.

## 데이터 갱신

각 `src/data/weapons/*.json`에 스키마에 맞는 레코드를 추가하면 목록/상세/비교에 자동 반영됩니다. 원시값인지 표시값인지 구분하고 출처·버전·확인일·정밀도를 기록하세요. 무기마다 다른 배율은 `multiplierOverrides`로 표현합니다.

`scripts/research.py`는 선택적으로 공개 HTML의 표를 관찰 기록으로 추출하는 개발용 도구입니다(Python + beautifulsoup4 필요). 원본 스크립트·스타일·이미지는 저장하지 않습니다. `scripts/build-dataset.py`는 검토된 관찰을 앱의 입력 데이터로 변환합니다. 재실행하면 분류 JSON을 다시 쓰므로 변경점을 검토해야 합니다. 앱 실행에는 Python이 필요하지 않습니다.

조사 기록의 전체 결과 표는 검증용이며 앱에서 import하지 않습니다. 앱은 거리 표본과 배율로 결과를 독립 계산합니다.
