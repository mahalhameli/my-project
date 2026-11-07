import { describe, expect, it } from "vitest";
import {
  applyH,
  curtainPanels,
  homography,
  isConvexQuad,
  pointInPolygon,
  sanitizeLayers,
  validateRegions,
  type Region,
} from "./photo-model";

const wall: Region = {
  id: "w1",
  kind: "wall",
  label: "Back wall",
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.15 },
    { x: 0.9, y: 0.85 },
    { x: 0.1, y: 0.9 },
  ],
  widthCm: 360,
  heightCm: 250,
};

describe("homography", () => {
  it("maps the four wall corners exactly onto the real wall in centimetres", () => {
    const H = homography(wall.points, [
      { x: 0, y: 0 },
      { x: 360, y: 0 },
      { x: 360, y: 250 },
      { x: 0, y: 250 },
    ]);
    const corners = wall.points.map((p) => applyH(H, p));
    expect(corners[0].x).toBeCloseTo(0, 6);
    expect(corners[1].x).toBeCloseTo(360, 6);
    expect(corners[2].y).toBeCloseTo(250, 6);
    expect(corners[3].y).toBeCloseTo(250, 6);
  });

  it("is perfectly repeatable: the same corners always give the same result", () => {
    const dst = [
      { x: 0, y: 0 },
      { x: 360, y: 0 },
      { x: 360, y: 250 },
      { x: 0, y: 250 },
    ];
    expect(homography(wall.points, dst)).toEqual(homography(wall.points, dst));
  });

  it("refuses corners that collapse into a line", () => {
    const flat = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
      { x: 0.2, y: 0 },
    ];
    expect(() => homography(flat, wall.points)).toThrow();
  });
});

describe("shapes", () => {
  it("recognises a proper four-cornered shape, and a twisted one", () => {
    expect(isConvexQuad(wall.points)).toBe(true);
    const twisted = [wall.points[0], wall.points[2], wall.points[1], wall.points[3]];
    expect(isConvexQuad(twisted)).toBe(false);
  });
  it("knows what is inside an outline", () => {
    expect(pointInPolygon({ x: 0.5, y: 0.5 }, wall.points)).toBe(true);
    expect(pointInPolygon({ x: 0.05, y: 0.5 }, wall.points)).toBe(false);
  });
});

describe("validateRegions", () => {
  it("accepts good outlines", () => {
    expect(validateRegions([wall]).ok).toBe(true);
  });
  it("needs four corners for a wall and a width", () => {
    expect(validateRegions([{ ...wall, points: wall.points.slice(0, 3) }]).ok).toBe(false);
    expect(validateRegions([{ ...wall, widthCm: undefined }]).ok).toBe(false);
  });
  it("rejects duplicate names and points far off the photo", () => {
    expect(validateRegions([wall, wall]).ok).toBe(false);
    expect(validateRegions([{ ...wall, points: [{ x: 5, y: 0 }, ...wall.points.slice(1)] }]).ok).toBe(false);
  });
});

describe("sanitizeLayers", () => {
  it("keeps only real materials of the right kind, on walls that exist", () => {
    const layers = sanitizeLayers(
      {
        walls: { w1: "wp-toile-des-jardins", ghost: "pt-rose-ancien" },
        floor: "wp-petits-pois", // a wallpaper is not a floor
        curtains: "fb-vichy-rose",
      },
      [wall],
    );
    expect(layers).toEqual({ walls: { w1: "wp-toile-des-jardins" }, floor: null, curtains: "fb-vichy-rose" });
  });
});

describe("curtains", () => {
  it("hangs the pole above and wider than the window, and the panels down to the floor", () => {
    const win: Region = {
      id: "win",
      kind: "window",
      label: "Window",
      widthCm: 120,
      points: [
        { x: 0.4, y: 0.3 },
        { x: 0.6, y: 0.3 },
        { x: 0.6, y: 0.6 },
        { x: 0.4, y: 0.6 },
      ],
    };
    const { panels, pole } = curtainPanels(win, [wall, win], 250);
    expect(pole[0].x).toBeLessThan(0.4);
    expect(pole[1].x).toBeGreaterThan(0.6);
    expect(pole[0].y).toBeLessThan(0.3);
    // Panels reach the wall's bottom edge (about 0.87 at the window's position)
    expect(panels[0].quad[3].y).toBeGreaterThan(0.85);
    expect(panels).toHaveLength(2);
  });
});
