/**
 * The model behind "Show Us Your Space".
 *
 * The Golden Rule: the client's photo is never redrawn. Its walls, floor,
 * windows, doors and the furniture they keep are outlined once and locked.
 * Each material is a separate layer that only paints inside its own outline,
 * and never inside a window, door or kept piece of furniture.
 *
 * Points are stored as fractions of the photo's width and height (0–1), so
 * outlines stay correct at any display size.
 */
import { MATERIALS, type Category } from "./materials";

export type Point = { x: number; y: number };

export type RegionKind = "wall" | "floor" | "window" | "door" | "keep";

export type Region = {
  id: string;
  kind: RegionKind;
  label: string;
  points: Point[];
  /** Walls: visible width. Floor: visible width. Windows: real width. (cm) */
  widthCm?: number;
  /** Walls: height. Floor: visible depth. (cm) */
  heightCm?: number;
};

export const REGION_INFO: Record<
  RegionKind,
  { french: string; english: string; corners: boolean; hint: string[] }
> = {
  wall: {
    french: "Un Mur",
    english: "A wall",
    corners: true,
    hint: [
      "Tap the top-left corner of the wall, where it meets the ceiling.",
      "Now the top-right corner, where it meets the ceiling.",
      "Now the bottom-right corner, where it meets the floor.",
      "And the bottom-left corner, where it meets the floor.",
    ],
  },
  floor: {
    french: "Le Sol",
    english: "The floor",
    corners: true,
    hint: [
      "Tap the far-left corner of the floor you can see.",
      "Now the far-right corner.",
      "Now the near-right corner, closest to you.",
      "And the near-left corner.",
    ],
  },
  window: {
    french: "Une Fenêtre",
    english: "A window",
    corners: true,
    hint: [
      "Tap the top-left corner of the window frame.",
      "Now the top-right corner.",
      "Now the bottom-right corner.",
      "And the bottom-left corner.",
    ],
  },
  door: {
    french: "Une Porte",
    english: "A door",
    corners: true,
    hint: [
      "Tap the top-left corner of the door frame.",
      "Now the top-right corner.",
      "Now the bottom-right corner, at the floor.",
      "And the bottom-left corner, at the floor.",
    ],
  },
  keep: {
    french: "À Garder",
    english: "Furniture to keep",
    corners: false,
    hint: ["Tap around the edge of the piece, point by point. Press “Finish” when you have gone all the way round."],
  },
};

export const MAX_PHOTOS_PER_ROOM = 3;
export const MAX_REGIONS = 30;
export const MAX_KEEP_POINTS = 40;

export type Layers = {
  /** Wall region id → wallpaper or paint id (null = leave the wall as it is). */
  walls: Record<string, string | null>;
  floor: string | null;
  curtains: string | null;
};

export const EMPTY_LAYERS: Layers = { walls: {}, floor: null, curtains: null };

/* ------------------------------------------------------------------ */
/*  Validation: the server never trusts what the browser sends          */
/* ------------------------------------------------------------------ */

const KINDS: RegionKind[] = ["wall", "floor", "window", "door", "keep"];

function finite(n: unknown, min: number, max: number): number | null {
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export function validateRegions(input: unknown): { ok: true; value: Region[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "The outlines could not be read." };
  if (input.length > MAX_REGIONS) return { ok: false, error: `Please use no more than ${MAX_REGIONS} outlines.` };
  const out: Region[] = [];
  const ids = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: "An outline could not be read." };
    const r = raw as Record<string, unknown>;
    const id = String(r.id ?? "");
    if (!/^[a-z0-9-]{1,40}$/i.test(id) || ids.has(id)) return { ok: false, error: "An outline has a bad name." };
    ids.add(id);
    if (!KINDS.includes(r.kind as RegionKind)) return { ok: false, error: "An outline is of an unknown kind." };
    const kind = r.kind as RegionKind;
    if (!Array.isArray(r.points)) return { ok: false, error: "An outline has no corners." };
    const points: Point[] = [];
    for (const p of r.points) {
      const x = finite((p as Point)?.x, -0.2, 1.2);
      const y = finite((p as Point)?.y, -0.2, 1.2);
      if (x === null || y === null) return { ok: false, error: "A corner lies outside the photo." };
      points.push({ x, y });
    }
    if (REGION_INFO[kind].corners ? points.length !== 4 : points.length < 3 || points.length > MAX_KEEP_POINTS) {
      return { ok: false, error: `“${REGION_INFO[kind].english}” needs ${REGION_INFO[kind].corners ? "exactly four corners" : "at least three points"}.` };
    }
    const region: Region = { id, kind, label: String(r.label ?? REGION_INFO[kind].english).slice(0, 40), points };
    if (kind === "wall" || kind === "floor" || kind === "window") {
      const w = finite(r.widthCm, 20, 3000);
      if (w === null) return { ok: false, error: `Please give the width of “${region.label}” (20 cm to 30 m).` };
      region.widthCm = w;
    }
    if (kind === "wall" || kind === "floor") {
      const h = finite(r.heightCm, 20, 3000);
      if (h === null) return { ok: false, error: `Please give the ${kind === "wall" ? "height" : "depth"} of “${region.label}”.` };
      region.heightCm = h;
    }
    out.push(region);
  }
  return { ok: true, value: out };
}

const CATEGORY_FOR: Record<"walls" | "floor" | "curtains", Category[]> = {
  walls: ["wallpaper", "paint"],
  floor: ["flooring"],
  curtains: ["fabric"],
};

function materialOk(id: unknown, layer: keyof typeof CATEGORY_FOR): string | null {
  if (id === null || id === undefined || id === "") return null;
  const m = MATERIALS.find((x) => x.id === id);
  return m && CATEGORY_FOR[layer].includes(m.category) ? m.id : null;
}

/** Keeps only valid materials, on walls that exist in the outlines. */
export function sanitizeLayers(input: unknown, regions: Region[]): Layers {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const walls: Record<string, string | null> = {};
  const rawWalls = (typeof raw.walls === "object" && raw.walls !== null ? raw.walls : {}) as Record<string, unknown>;
  for (const r of regions) {
    if (r.kind === "wall") walls[r.id] = materialOk(rawWalls[r.id], "walls");
  }
  return { walls, floor: materialOk(raw.floor, "floor"), curtains: materialOk(raw.curtains, "curtains") };
}

export function parseRegions(json: string): Region[] {
  try {
    const r = validateRegions(JSON.parse(json));
    return r.ok ? r.value : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Perspective                                                         */
/* ------------------------------------------------------------------ */

export type Mat3 = [number, number, number, number, number, number, number, number, number];

/**
 * The homography H (row-major) that maps each src[i] to dst[i].
 * Used to map a point in the photo to centimetres on the real wall.
 */
export function homography(src: Point[], dst: Point[]): Mat3 {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[pivot][c])) pivot = r;
    if (Math.abs(M[pivot][c]) < 1e-12) throw new Error("These corners don't form a proper shape.");
    [M[c], M[pivot]] = [M[pivot], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

export function applyH(H: Mat3, p: Point): Point {
  const w = H[6] * p.x + H[7] * p.y + H[8];
  return { x: (H[0] * p.x + H[1] * p.y + H[2]) / w, y: (H[3] * p.x + H[4] * p.y + H[5]) / w };
}

/** True when four points make a sensible, non-twisted shape. */
export function isConvexQuad(pts: Point[]): boolean {
  if (pts.length !== 4) return false;
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-9) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

export function pointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/* ------------------------------------------------------------------ */
/*  Curtains: where the panels hang, worked out from the outlines        */
/* ------------------------------------------------------------------ */

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Where the floor is directly below `p`, using the bottom edge of the wall behind it. */
function floorBelow(p: Point, wall: Region | undefined, fallbackDrop: number): number {
  if (wall) {
    const bl = wall.points[3];
    const br = wall.points[2];
    if (Math.abs(br.x - bl.x) > 1e-6) {
      const t = (p.x - bl.x) / (br.x - bl.x);
      return bl.y + (br.y - bl.y) * t;
    }
  }
  return Math.min(1, p.y + fallbackDrop);
}

export type CurtainPanel = { quad: Point[]; widthCm: number; dropCm: number };

/**
 * Two floor-length panels per window, hung high and wide, gathered open:
 * the pole sits a little above the frame and the panels just kiss the floor.
 */
export function curtainPanels(window: Region, regions: Region[], ceilingCm: number): { panels: CurtainPanel[]; pole: Point[] } {
  const [tl, tr, br, bl] = window.points;
  const centre = { x: (tl.x + tr.x + br.x + bl.x) / 4, y: (tl.y + tr.y + br.y + bl.y) / 4 };
  const wall = regions.find((r) => r.kind === "wall" && pointInPolygon(centre, r.points));
  const winHeight = (bl.y - tl.y + (br.y - tr.y)) / 2;

  // The pole: 12% wider than the frame on each side, raised by 8% of the window's height.
  const ext = 0.12;
  const raise = 0.08 * winHeight;
  const topL = lerp(tr, tl, 1 + ext);
  const topR = lerp(tl, tr, 1 + ext);
  const poleL = { x: topL.x, y: topL.y - raise };
  const poleR = { x: topR.x, y: topR.y - raise };

  // Each gathered panel covers about 30% of the pole; the rest of the window stays open.
  const panelFrac = 0.3;
  const leftInner = lerp(poleL, poleR, panelFrac);
  const rightInner = lerp(poleR, poleL, panelFrac);
  const toFloor = (p: Point): Point => ({ x: p.x, y: floorBelow(p, wall, winHeight * 1.4) });

  const left = [poleL, leftInner, toFloor(leftInner), toFloor(poleL)];
  const right = [rightInner, poleR, toFloor(poleR), toFloor(rightInner)];

  const windowWidthCm = window.widthCm ?? 120;
  const panelWidthCm = windowWidthCm * (1 + 2 * ext) * panelFrac;
  const dropCm = Math.max(100, ceilingCm - 15);
  return {
    panels: [
      { quad: left, widthCm: panelWidthCm, dropCm },
      { quad: right, widthCm: panelWidthCm, dropCm },
    ],
    pole: [poleL, poleR],
  };
}
