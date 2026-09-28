import { memo, type CSSProperties } from "react";
import type { Weapon } from "../data/weapons";
import { displayDamage } from "../domain/damage";
import { WeaponDetails } from "./WeaponDetails";

// Stable key and permanent parent: React never remounts a card when its location changes.
export const WeaponCard = memo(function WeaponCard({
  weapon: w,
}: {
  weapon: Weapon;
}) {
  return (
    <article
      className="physical"
      data-id={w.id}
      style={{ "--c": w.color } as CSSProperties}
      aria-label={w.name}
    >
      <div className="physical-back">PUBG</div>
      <div className="physical-front">
        <div className="physical-head">
          <div className="eyebrow">
            {w.category} · {w.ammo || "WEAPON ARCHIVE"}
          </div>
          <h2>{w.name}</h2>
          <img draggable={false} alt={w.name} src={w.image} />
          <button className="physical-close" aria-label={w.name + " 닫기"}>
            ×
          </button>
        </div>
        <div className="physical-small">
          {displayDamage(w.damage)}
          {w.pellets > 1 ? ` ×${w.pellets}` : ""} DMG　 {w.rpm} RPM
        </div>
        <WeaponDetails weapon={w} />
        <div className="physical-vs">
          VS<small>끌어서 비교 위치 선택</small>
        </div>
      </div>
    </article>
  );
});
