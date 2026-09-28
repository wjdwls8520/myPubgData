import { weapons } from "../data/weapons";
import type { Card, CardState, Drag } from "./types";

// React owns card content. This controller owns only pose, gesture and animation.
// A card always stays beneath the same parent, preserving element identity.
export function createArmory(root: HTMLElement) {
  const registry = new Map<string, Card>();
  let cat = "AR",
    slots: Card[] = [],
    held: Card[] = [],
    drag: Drag | null = null,
    hovered: Card | null = null,
    topOrder = 5;
  const mat = root.querySelector<HTMLElement>(".mat")!,
    drop = root.querySelector<HTMLElement>("#drop")!;
  const layer = root.querySelector<HTMLElement>("#card-layer")!,
    guide = root.querySelector<HTMLElement>("#slot-guide")!;
  const placeholder = root.querySelector<HTMLElement>("#placeholder")!,
    counter = root.querySelector<HTMLElement>("#count")!;
  const tabs = root.querySelectorAll<HTMLButtonElement>(".tabs button");
  const elements = new Map(
    [...root.querySelectorAll<HTMLElement>(".physical")].map((el) => [
      el.dataset.id!,
      el,
    ]),
  );
  function randomSpot() {
    return { x: Math.random(), y: Math.random(), r: Math.random() * 48 - 24 };
  }
  function place(
    c: Card,
    x: number,
    y: number,
    w: number,
    h: number,
    r = 0,
    z = 5,
  ) {
    c.pose = { x, y, w, h, r };
    Object.assign(c.el.style, {
      left: x + "px",
      top: y + "px",
      width: w + "px",
      height: h + "px",
      transform: `rotate(${r}deg)`,
      zIndex: z,
    });
  }
  function deskPose(c: Card) {
    const r = mat.getBoundingClientRect(),
      p = c.spot;
    let x,
      y,
      angle = p.r;
    if (c.rack != null) {
      const cols = Math.max(1, Math.floor((r.width - 32) / 112)),
        rows = Math.ceil(weapons.length / cols),
        step = Math.min(
          24,
          Math.max(0, (r.height * 0.3 - 165) / Math.max(1, rows - 1)),
        );
      x = r.left + 16 + (c.rack % cols) * 112;
      y = r.top + r.height * 0.7 + 8 + Math.floor(c.rack / cols) * step;
      angle = 0;
    } else {
      x = r.left + 40 + p.x * Math.max(0, r.width - 188);
      y = r.top + 50 + p.y * Math.max(0, r.height * 0.7 - 225);
    }
    place(c, x, y, 108, 149, angle, 5 + (c.order % 50));
  }
  function setState(c: Card, state: CardState) {
    const title = c.el.querySelector("h2")!,
      keep = state === "drag" || (state === "hand" && c.state === "desk"),
      font = keep ? getComputedStyle(title).font : "";
    clearTimeout(c.dealTimer);
    c.el.style.transitionDelay = "";
    c.el.style.removeProperty("--deal-delay");
    clearTimeout(c.titleTimer);
    c.titleFade?.cancel();
    title.style.transition = "";
    title.style.font = font;
    c.state = state;
    c.el.dataset.state = state;
    if (state !== "detail") {
      delete c.el.dataset.scrolled;
      c.el.querySelector<HTMLElement>(".physical-details")!.scrollTop = 0;
    }
    c.el.classList.remove("lift");
    c.el.classList.toggle("back", state === "desk" && c.back);
    if (state === "hand" && keep) {
      c.titleTimer = setTimeout(
        () => {
          c.titleFade = title.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 80,
            fill: "forwards",
          });
          c.titleTimer = setTimeout(() => {
            title.style.transition = "none";
            title.style.font = "";
            c.titleFade?.cancel();
            c.titleFade = title.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 140,
            });
          }, 80);
        },
        500 + Math.max(0, held.indexOf(c)) * 45,
      );
    }
  }
  function scatter(c: Card, front = true) {
    setState(c, "desk");
    if (front) {
      c.back = false;
      c.el.classList.remove("back");
      const used = new Set(
        [...registry.values()]
          .filter((x) => x !== c && x.state === "desk" && x.rack != null)
          .map((x) => x.rack),
      );
      c.rack = 0;
      while (used.has(c.rack)) c.rack++;
    } else {
      c.rack = null;
      c.spot = randomSpot();
    }
    c.order = ++topOrder;
    deskPose(c);
  }
  function handLayout() {
    const r = mat.getBoundingClientRect(),
      w = innerWidth < 850 ? 142 : 174,
      h = innerWidth < 850 ? 204 : 236,
      step = Math.min(134, (r.width - 32 - w) / Math.max(1, held.length - 1)),
      left = r.left + (r.width - w - step * (held.length - 1)) / 2;
    held.forEach((c, i) => {
      c.rest = {
        x: left + i * step,
        y: innerHeight - h + 64,
        w,
        h,
        r: (i - (held.length - 1) / 2) * 5,
      };
      const p = c.rest;
      place(c, p.x, p.y, p.w, p.h, p.r, 2000 + i);
    });
    hovered = null;
  }
  function boardLayout() {
    const r = drop.getBoundingClientRect(),
      gap = 14,
      n = slots.length;
    slots.forEach((c, i) => {
      const w = n === 1 ? Math.min(760, r.width - 24) : (r.width - 38) / 2,
        x = n === 1 ? r.left + (r.width - w) / 2 : r.left + 12 + i * (w + gap);
      setState(c, "detail");
      place(c, x, r.top + 12, w, r.height - 24, 0, 70 + i);
    });
    placeholder.hidden = !!n;
    layer.classList.toggle("comparing", !!n);
    count();
  }
  function count() {
    counter.textContent = `ARCHIVE ${[...registry.values()].filter((c) => c.state === "desk").length} · HAND ${held.length} · TABLE ${slots.length}`;
  }
  function dismiss(c: Card) {
    slots = slots.filter((x) => x !== c);
    scatter(c, true);
    boardLayout();
    count();
  }
  weapons.forEach((weapon) => {
    const el = elements.get(weapon.id)!;
    const c: Card = {
      id: weapon.id,
      weapon,
      el,
      state: "desk",
      spot: randomSpot(),
      back: Math.random() < 0.38,
      order: ++topOrder,
      pose: { x: 0, y: 0, w: 108, h: 149, r: 0 },
      rest: { x: 0, y: 0, w: 108, h: 149, r: 0 },
    };
    registry.set(c.id, c);
    el.querySelector<HTMLButtonElement>(".physical-close")!.onclick = () =>
      dismiss(c);
    el.onpointerdown = (e) => {
      if (
        (e.target as Element).closest("button") ||
        c.state === "detail" ||
        drag
      )
        return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      drag = {
        c,
        old: c.state,
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
      };
      hovered = null;
      setState(c, "drag");
      place(c, rect.left, rect.top, c.pose.w, c.pose.h, 0, 4000);
      el.setPointerCapture(e.pointerId);
    };
    el.onpointermove = (e) => {
      if (!drag || drag.c !== c) return;
      place(
        c,
        e.clientX - drag.dx,
        e.clientY - drag.dy,
        c.pose.w,
        c.pose.h,
        0,
        4000,
      );
      showGuide(e);
    };
    el.onpointerup = (e) => finish(e, false);
    el.onpointercancel = (e) => finish(e, true);

    setState(c, "desk");
    deskPose(c);
  });
  function showGuide(e: PointerEvent) {
    const r = drop.getBoundingClientRect(),
      inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
    guide.hidden = !inside;
    if (!inside) return;
    const side = slots.length
      ? e.clientX < r.left + r.width / 2
        ? 0
        : 1
      : null;
    if (drag) drag.side = side;
    Object.assign(guide.style, {
      left: r.left + 12 + (side === 1 ? r.width / 2 : 0) + "px",
      top: r.top + 12 + "px",
      width: (side === null ? r.width - 24 : r.width / 2 - 24) + "px",
      height: r.height - 24 + "px",
    });
    guide.querySelector("span")!.textContent =
      side === null
        ? "여기에 놓아 살펴보기"
        : (side === 0 ? "왼쪽" : "오른쪽") +
          (slots.length === 2 ? " 카드 교체" : "에 비교 카드 놓기");
  }
  function finish(e: PointerEvent, cancel: boolean) {
    if (!drag) return;
    const d = drag,
      c = d.c,
      r = drop.getBoundingClientRect(),
      valid =
        !cancel &&
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
    drag = null;
    guide.hidden = true;
    if (valid) {
      held = held.filter((x) => x !== c);
      if (!slots.length) slots = [c];
      else {
        const side = e.clientX < r.left + r.width / 2 ? 0 : 1;
        if (slots.length === 1)
          slots = side === 0 ? [c, slots[0]] : [slots[0], c];
        else {
          scatter(slots[side], true);
          slots[side] = c;
        }
      }
      setState(c, "detail");
      handLayout();
      boardLayout();
    } else {
      setState(c, d.old);
      d.old === "hand" ? handLayout() : deskPose(c);
    }
    count();
  }
  function switchHand(next: string, initial = false) {
    if (drag) return;
    held.forEach((c) => scatter(c, false));
    held = [];
    cat = next;
    weapons
      .filter((w) => w.category === cat)
      .forEach((w) => {
        const c = registry.get(w.id)!;
        if (c.state !== "detail") {
          held.push(c);
          setState(c, "hand");
        }
      });
    handLayout();
    if (!initial)
      held.forEach((c, i) => {
        c.el.style.transitionDelay = i * 45 + "ms";
        c.el.style.setProperty("--deal-delay", i * 45 + "ms");
        clearTimeout(c.dealTimer);
        c.dealTimer = setTimeout(
          () => {
            c.el.style.transitionDelay = "";
            c.el.style.removeProperty("--deal-delay");
          },
          650 + i * 45,
        );
      });
    tabs.forEach((b) => b.classList.toggle("on", b.dataset.cat === cat));
    count();
  }
  tabs.forEach((b) => (b.onclick = () => switchHand(b.dataset.cat!)));
  const onHover = (e: PointerEvent) => {
    if (drag || e.pointerType === "touch") return;
    let candidate = null;
    for (const c of held) {
      const p = c.rest;
      if (
        e.clientX >= p.x &&
        e.clientX <= p.x + p.w &&
        e.clientY >= p.y - 84 &&
        e.clientY <= p.y + p.h
      )
        candidate = c;
    }
    if (candidate === hovered) return;
    if (hovered) {
      const c = hovered,
        p = c.rest;
      place(c, p.x, p.y, p.w, p.h, p.r, 2000 + held.indexOf(c));
      c.el.classList.remove("lift");
    }
    hovered = candidate;
    if (candidate) {
      const p = candidate.rest;
      place(candidate, p.x, p.y - 78, p.w, p.h, 0, 3000);
      candidate.el.classList.add("lift");
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (!drag && e.key.toLowerCase() === "x" && slots.length)
      dismiss(slots[slots.length - 1]);
  };
  const onResize = () => {
    [...registry.values()].filter((c) => c.state === "desk").forEach(deskPose);
    handLayout();
    boardLayout();
  };
  document.addEventListener("pointermove", onHover);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  guide.hidden = true;
  switchHand("AR", true);
  return {
    destroy() {
      document.removeEventListener("pointermove", onHover);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      registry.forEach((c) => {
        clearTimeout(c.titleTimer);
        clearTimeout(c.dealTimer);
        c.titleFade?.cancel();
        c.el.onpointerdown = null;
        c.el.onpointermove = null;
        c.el.onpointerup = null;
        c.el.onpointercancel = null;
        c.el.querySelector<HTMLButtonElement>(".physical-close")!.onclick =
          null;
      });
      tabs.forEach((b) => (b.onclick = null));
    },
  };
}
