import { useLayoutEffect, useRef } from "react";
import { WeaponCard } from "./components/WeaponCard";
import { weapons, categories } from "./data/weapons";
import { createArmory } from "./armory/controller";

export function App() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => createArmory(root.current!).destroy, []);
  return (
    <div ref={root}>
      <div className="app">
        <header>
          <button type="button" className="brand flex items-center" onClick={() => window.location.reload()} aria-label="BATTLEGROUND DECK 새로고침">
            <span className="mark">BD</span>
            <span>
              <b>BATTLEGROUND DECK</b>
              <small>TACTICAL WEAPON ARCHIVE</small>
            </span>
          </button>
          <div className="guide">
            <strong>HOVER</strong> 카드 확인 · <strong>DRAG</strong> 분석 · 두
            번째 카드로 비교
          </div>
        </header>
        <main className="desk">
          <div className="mat">
            <div className="drop" id="drop">
              <div className="placeholder" id="placeholder">
                <b>카드를 분석 매트에 올려놓으세요</b>
                <span>DRAG A CARD UP · MAX 2</span>
              </div>
            </div>
            <div className="count" id="count" />
          </div>
        </main>
        <nav className="tabs" aria-label="무기 종류">
          {categories.map(([id, label]) => (
            <button key={id} data-cat={id} className={id === "AR" ? "on" : ""}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div id="card-layer" className="fixed inset-0 pointer-events-none">
        {weapons.map((w) => (
          <WeaponCard key={w.id} weapon={w} />
        ))}
      </div>
      <div id="slot-guide" hidden>
        <span />
      </div>
    </div>
  );
}
