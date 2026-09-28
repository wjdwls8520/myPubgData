interface Props {
  distance: number;
  maxMeasuredDistance: number;
  onDistance: (distance: number) => void;
}

export function DistanceControl({
  distance,
  maxMeasuredDistance,
  onDistance,
}: Props) {
  return (
    <section className="distance-section" aria-label="거리 설정">
      <div className="section-heading">
        <span>DISTANCE / 사거리</span>
        <strong>
          {distance}
          <small> m</small>
        </strong>
      </div>
      <input
        aria-label="거리 (m)"
        aria-valuetext={`${distance}미터`}
        type="range"
        min="0"
        max="500"
        step="1"
        value={distance}
        onChange={(e) => onDistance(Number(e.target.value))}
      />
      <div className="range-caption">
        <span>0m</span>
        <span>실측 ≤ {maxMeasuredDistance}m</span>
        <span>500m</span>
      </div>
      {distance > maxMeasuredDistance && (
        <p className="data-warning" role="status">
          실측 범위 밖입니다. {maxMeasuredDistance}m 이하에서 피해를 확인하세요.
        </p>
      )}
    </section>
  );
}
