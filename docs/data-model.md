# Data model

UI → repository interface → JSON adapter. UI는 JSON을 import하지 않는다. 계산 엔진은 repository와 React에 의존하지 않는 pure TypeScript다.

Weapon은 category, ammoType, status, carePackage, baseDamage(실측 최소 거리값과 구별), measuredRange, falloff, multiplierOverrides, firing model, provenance를 가진다. JSON 파일은 카테고리별로 분리한다. body-parts, weapon-classes, armor, timing, patch history는 별도 파일이다.

Firing은 auto / single / burst / bolt / pump discriminated union. burstSize, intraBurstInterval, perfectBoundaryInterval, normalBoundaryInterval, cycleLimit 등의 의미를 명시한다. unknown은 null이며 0으로 대체하지 않는다.

Source metadata: source, sourceUrl, retrievedAt, gameVersion, confidence, precision. verified는 공개 문서에서 확인했다는 의미이지 게임 raw 검증이라는 뜻이 아니다. 표본은 displayed precision, 보간과 RPM 변환은 derived임을 UI에 알린다.

Zod로 모든 JSON을 검증하고 중복 ID, 거리 정렬/범위, 13개 배율, 양수 주기, 첫 표본과 base의 정합성을 확인한다. 신규 무기는 해당 JSON에 레코드를 추가하면 된다.

향후 WeaponRepository 구현을 ApiWeaponRepository로 교체하고 app 주입만 바꾸면 된다. 모든 repository 메서드는 Promise를 반환하며 로딩/실패 UI를 제공한다.
