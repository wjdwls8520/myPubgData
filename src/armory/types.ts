import type { Weapon } from "../data/weapons";
export type CardState = "desk" | "hand" | "drag" | "detail";
export interface Pose {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}
export interface Card {
  id: string;
  weapon: Weapon;
  el: HTMLElement;
  state: CardState;
  spot: { x: number; y: number; r: number };
  back: boolean;
  order: number;
  pose: Pose;
  rest: Pose;
  rack?: number | null;
  titleTimer?: ReturnType<typeof setTimeout>;
  titleFade?: Animation;
  dealTimer?: ReturnType<typeof setTimeout>;
}
export interface Drag {
  c: Card;
  old: CardState;
  dx: number;
  dy: number;
  side?: number | null;
}
