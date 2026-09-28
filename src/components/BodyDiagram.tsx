import { BODY_PARTS, displayDamage, hitResult } from "../domain/damage";
import type { Weapon } from "../data/weapons";
import type {
  Ballistics,
  BodyPart,
  Conditions,
  HitResult,
} from "../domain/types";

export type BodyMetric = "damage" | "hits" | "ttk";
// Original segmented silhouette; paired limbs share the same damage region.
const SHAPES: Record<BodyPart, string> = {
  Head: "M180 13 C164 13 158 24 160 42 L165 58 Q180 73 195 58 L200 42 C202 24 196 13 180 13Z",
  Neck: "M170 65 Q180 72 190 65 L192 81 L180 87 L168 81Z",
  Clavicle:
    "M168 81 L149 90 L143 105 L180 112 L217 105 L211 90 L192 81 L180 87Z",
  Chest: "M143 108 L180 115 L217 108 L213 147 Q180 160 147 147Z",
  UpperStomach: "M148 150 Q180 162 212 150 L208 178 L152 178Z",
  LowerStomach: "M152 181 L208 181 L211 206 Q180 217 149 206Z",
  Pelvis:
    "M149 209 Q180 220 211 209 L216 236 L193 247 L180 234 L167 247 L144 236Z",
  UpperArm:
    "M146 93 L135 95 Q123 102 120 125 L114 153 L132 160 L142 135Z M214 93 L225 95 Q237 102 240 125 L246 153 L228 160 L218 135Z",
  Forearm:
    "M114 157 L132 164 L122 192 L112 218 L98 214 L106 183Z M246 157 L228 164 L238 192 L248 218 L262 214 L254 183Z",
  Hand: "M98 218 L112 222 L108 243 L100 252 L91 247 L92 233Z M262 218 L248 222 L252 243 L260 252 L269 247 L268 233Z",
  Thigh:
    "M145 240 L167 251 L177 243 L174 289 L150 290 L141 264Z M215 240 L193 251 L183 243 L186 289 L210 290 L219 264Z",
  Calf: "M150 294 L174 293 L174 318 L168 357 L154 357 L148 321Z M210 294 L186 293 L186 318 L192 357 L206 357 L212 321Z",
  Foot: "M154 361 L168 361 L171 377 L163 384 L139 384 L139 376Z M206 361 L192 361 L189 377 L197 384 L221 384 L221 376Z",
};
const ANCHORS: Record<BodyPart, [number, number, number, number]> = {
  Head: [160, 35, 8, 19],
  Neck: [169, 76, 8, 61],
  Clavicle: [149, 97, 8, 103],
  Chest: [149, 134, 8, 145],
  UpperStomach: [153, 165, 8, 187],
  LowerStomach: [151, 195, 8, 229],
  Pelvis: [146, 228, 8, 271],
  UpperArm: [237, 127, 278, 103],
  Forearm: [249, 187, 278, 158],
  Hand: [261, 237, 278, 213],
  Thigh: [211, 265, 278, 268],
  Calf: [207, 326, 278, 323],
  Foot: [213, 378, 278, 369],
};
function metricValue(result: HitResult | null, metric: BodyMetric) {
  if (!result) return "—";
  if (metric === "damage") return displayDamage(result.damage);
  if (metric === "hits") return String(result.hits);
  return result.ttk == null ? "—" : result.ttk.toFixed(2) + "s";
}
export function BodyDiagram({
  weapon,
  data,
  conditions,
  selected,
  metric,
  onSelect,
}: {
  weapon: Weapon;
  data: Ballistics;
  conditions: Conditions;
  selected: BodyPart;
  metric: BodyMetric;
  onSelect: (part: BodyPart) => void;
}) {
  return (
    <svg
      className="body-diagram"
      viewBox="0 0 360 405"
      aria-label="인체 부위별 피해. 부위를 선택하면 피해와 발수, TTK를 확인할 수 있습니다."
    >
      <line
        x1="180"
        x2="180"
        y1="5"
        y2="397"
        stroke="#c6ccbd"
        strokeDasharray="2 6"
      />
      {BODY_PARTS.map((part) => {
        const result = hitResult(weapon, data, part.id, conditions);
        const [ax, ay, lx, ly] = ANCHORS[part.id];
        const active = selected === part.id;
        const fill = !result
          ? "#d9ddd2"
          : result.hits <= 1
            ? "#d9957e"
            : result.hits <= 2
              ? "#dbb37d"
              : result.hits <= 3
                ? "#b9c491"
                : "#a8baa4";
        const value = metricValue(result, metric);
        return (
          <g
            key={part.id}
            role="button"
            tabIndex={0}
            aria-label={`${part.label} ${value}`}
            aria-pressed={active}
            className={active ? "body-region selected" : "body-region"}
            onClick={() => onSelect(part.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(part.id);
              }
            }}
          >
            <title>
              {part.label} · 피해 {displayDamage(result?.damage)} ·{" "}
              {result?.hits ?? "—"}
              {weapon.pellets > 1 && conditions.shotgunMode === "pellet"
                ? "펠릿"
                : "발"}{" "}
              · TTK {result?.ttk?.toFixed(3) ?? "—"}s
            </title>
            <path
              d={SHAPES[part.id]}
              fill={fill}
              stroke={active ? "#344a35" : "#f6f6f0"}
              strokeWidth={active ? 2 : 1.5}
            />
            <path
              d={`M${ax},${ay} L${lx < 100 ? 100 : 260},${ly + 16} H${lx < 100 ? lx + 74 : lx}`}
              fill="none"
              stroke={active ? "#607858" : "#b7bfad"}
              strokeWidth="1"
            />
            <circle cx={ax} cy={ay} r="2" fill="#607858" />
            <rect
              x={lx}
              y={ly}
              width="74"
              height="33"
              rx="5"
              fill={active ? "#e0e8d4" : "#edf0e7"}
            />
            <text x={lx + 7} y={ly + 12} className="body-label">
              {part.label}
            </text>
            <text x={lx + 7} y={ly + 26} className="body-value">
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
