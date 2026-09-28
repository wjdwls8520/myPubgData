import { useState } from "react";
import { ballistics, dataSource, type Weapon } from "../data/weapons";
import {
  BODY_PARTS,
  DEFAULT_CONDITIONS,
  displayDamage,
  hitResult,
  rpmFor,
} from "../domain/damage";
import type { ArmorLevel, BodyPart, Conditions, Scope } from "../domain/types";
import { BodyDiagram, type BodyMetric } from "./BodyDiagram";
import { DistanceControl } from "./DistanceControl";
import { syncDetailScroll } from "../armory/detailScroll";

export function WeaponDetails({ weapon }: { weapon: Weapon }) {
  const data = ballistics[weapon.referenceId];
  const [conditions, setConditions] = useState<Conditions>({
    ...DEFAULT_CONDITIONS,
  });
  const [part, setPart] = useState<BodyPart>("Chest");
  const [metric, setMetric] = useState<BodyMetric>("damage");
  const update = (patch: Partial<Conditions>) =>
    setConditions((current) => ({ ...current, ...patch }));
  const result = hitResult(weapon, data, part, conditions);
  const timing = data.timings;
  const isPellet = weapon.pellets > 1 && conditions.shotgunMode === "pellet";
  return (
    <div
      className="physical-details"
      tabIndex={0}
      aria-label={`${weapon.name} 상세 정보`}
      onScroll={(event) => syncDetailScroll(event.currentTarget)}
    >
      <div className="summary">
        <div className="metric">
          <span>{weapon.pellets > 1 ? "펠릿당 기본 피해" : "기본 피해"}</span>
          <b>
            {displayDamage(weapon.damage)}
            {weapon.pellets > 1 && <small> ×{weapon.pellets}</small>}
          </b>
        </div>
        <div className="metric">
          <span>연사 속도</span>
          <b>
            {rpmFor(data, conditions)} <small>RPM</small>
          </b>
        </div>
        <div className="metric">
          <span>탄종</span>
          <b>{weapon.ammo}</b>
        </div>
      </div>
      <div className="armor-controls">
        {(
          [
            ["helmet", "헬멧"],
            ["vest", "조끼"],
          ] as const
        ).map(([key, label]) => (
          <div className="settings" key={key} role="group" aria-label={label}>
            <span>{label}</span>
            {["없음", "Lv.1", "Lv.2", "Lv.3"].map((name, level) => (
              <button
                key={level}
                className={conditions[key] === level ? "on" : ""}
                aria-label={`${label} ${name}`}
                aria-pressed={conditions[key] === level}
                onClick={() => update({ [key]: level as ArmorLevel })}
              >
                {name}
              </button>
            ))}
          </div>
        ))}
      </div>
      <DistanceControl
        distance={conditions.distance}
        maxMeasuredDistance={data.maxDistance}
        onDistance={(distance) => update({ distance })}
      />
      <div className="section-heading body-heading">
        <span>HIT ZONES / 100 HP</span>
        <div className="metric-tabs" role="group" aria-label="인체 표시 수치">
          {(
            [
              ["damage", "피해"],
              ["hits", isPellet ? "펠릿 수" : "발수"],
              ["ttk", "TTK"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              className={metric === value ? "on" : ""}
              aria-pressed={metric === value}
              onClick={() => setMetric(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="target-summary" aria-live="polite">
        <span>
          {BODY_PARTS.find((p) => p.id === part)!.label} · {conditions.distance}
          m
        </span>
        <strong>
          {displayDamage(result?.damage)} <small>DMG</small>
        </strong>
        <span>
          {result?.hits ?? "—"}
          {isPellet ? "펠릿" : "발"} ·{" "}
          {result?.ttk == null ? "—" : result.ttk.toFixed(3) + "s"}
        </span>
      </div>
      <BodyDiagram
        weapon={weapon}
        data={data}
        conditions={conditions}
        selected={part}
        metric={metric}
        onSelect={setPart}
      />
      <p className="detail-hint">
        부위를 눌러 선택 · 거리와 방어구에 따라 피해가 바뀝니다.
      </p>
      <div className="timing-controls">
        {["burst", "single_fire", "double_barrel_shotgun"].includes(
          timing.type,
        ) && (
          <label>
            단발·점사 타이밍
            <select
              aria-label="발사 숙련도"
              value={conditions.skill}
              onChange={(e) =>
                update({ skill: e.target.value as Conditions["skill"] })
              }
            >
              <option value="perfect">최적 간격</option>
              <option value="normal">일반 간격</option>
            </select>
          </label>
        )}
        {["bolt_zoom", "win94"].includes(timing.type) && (
          <label>
            재조준 기준
            <select
              aria-label="재조준 배율"
              value={conditions.scope}
              onChange={(e) => update({ scope: e.target.value as Scope })}
            >
              <option value="no-ads">조준 없음</option>
              {timing.type === "win94" ? (
                <option value="4x">기본 스코프</option>
              ) : (
                ["2x", "4x", "6x", "8x"].map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))
              )}
            </select>
          </label>
        )}
        {timing.type === "mg3" && (
          <label>
            발사 모드
            <select
              aria-label="MG3 발사 모드"
              value={conditions.mg3Mode}
              onChange={(e) =>
                update({ mg3Mode: e.target.value as Conditions["mg3Mode"] })
              }
            >
              <option value="990">990 RPM 모드</option>
              <option value="660">660 RPM 모드</option>
            </select>
          </label>
        )}
        {weapon.pellets > 1 && (
          <label>
            산탄 계산
            <select
              aria-label="산탄 계산 기준"
              value={conditions.shotgunMode}
              onChange={(e) =>
                update({
                  shotgunMode: e.target.value as Conditions["shotgunMode"],
                })
              }
            >
              <option value="all">전탄 동일 부위 명중</option>
              <option value="pellet">펠릿 1개</option>
            </select>
          </label>
        )}
      </div>
      {weapon.pellets > 1 && (
        <p className="data-warning">
          산포 미반영. 전탄 모드는 {weapon.pellets}개 펠릿이 같은 부위에 명중한
          이론값이며, 1펠릿 모드에서는 TTK를 계산하지 않습니다.
        </p>
      )}
      <p className="detail-hint">
        TTK: 첫 명중부터 · 체력 100 · 표시값 반올림 전 계산. 탄속·방어구
        파손·일반 탄창 재장전은 제외하며, 쌍열 산탄총 재장전은 포함합니다.
      </p>
      <footer className="data-source">
        <a href={dataSource.source} target="_blank" rel="noreferrer">
          pubgstatistics.com ↗
        </a>
        <span>
          PUBG {dataSource.datasetVersion} ·{" "}
          {dataSource.sourceUpdatedAt.slice(0, 10)}
        </span>
        <span>
          해당 무기 데이터 {data.pubgVersion.major}.{data.pubgVersion.minor} ·
          실측 사이 선형 보간
        </span>
      </footer>
    </div>
  );
}
