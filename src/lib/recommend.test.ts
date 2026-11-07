import { describe, expect, it } from "vitest";
import { DEFAULT_CONSULTATION, validateConsultation, type Consultation } from "./consultation";
import { MATERIALS } from "./materials";
import {
  curtainFabric,
  paintTins,
  recommend,
  scoreMaterial,
  wallpaperRolls,
} from "./recommend";

const room = (over: Partial<Consultation> = {}): Consultation => ({
  ...DEFAULT_CONSULTATION,
  moods: ["calm"],
  ...over,
});
const byId = (id: string) => MATERIALS.find((m) => m.id === id)!;

describe("validateConsultation", () => {
  it("accepts a complete consultation", () => {
    expect(validateConsultation(room()).ok).toBe(true);
  });
  it("rejects missing moods and impossible sizes", () => {
    expect(validateConsultation(room({ moods: [] })).ok).toBe(false);
    expect(validateConsultation(room({ lengthM: 0.5 })).ok).toBe(false);
    expect(validateConsultation({ ...room(), ageStage: "adult" }).ok).toBe(false);
  });
  it("rejects more than three moods", () => {
    expect(validateConsultation(room({ moods: ["calm", "fresh", "cosy", "classic"] })).ok).toBe(false);
  });
  it("ignores window width when there are no windows", () => {
    const r = validateConsultation({ ...room(), windows: 0, windowWidthCm: "nonsense" });
    expect(r.ok && r.value.windowWidthCm).toBe(0);
  });
});

describe("designer rules", () => {
  it("prefers warm undertones in a north-facing room", () => {
    const north = room({ orientation: "north" });
    const warm = scoreMaterial(byId("pt-lait-damande"), north);
    const cool = scoreMaterial(byId("pt-gris-pigeon"), north);
    expect(warm.score).toBeGreaterThan(cool.score);
    expect(cool.cautions.join(" ")).toMatch(/north light/);
  });

  it("warns against spongeable paper for little hands", () => {
    const r = scoreMaterial(byId("wp-grand-bouquet"), room({ ageStage: "young", budget: "generous" }));
    expect(r.cautions.join(" ")).toMatch(/spongeable/i);
  });

  it("steers away from dust-holding materials when there are allergies", () => {
    const nursery = room({ ageStage: "nursery" });
    const withoutAllergies = recommend("flooring", nursery).map((r) => r.material.id);
    const withAllergies = recommend("flooring", { ...nursery, allergies: true }).map((r) => r.material.id);
    expect(withoutAllergies).toContain("fl-moquette-laine");
    expect(withAllergies).not.toContain("fl-moquette-laine");
  });

  it("pairs a large paper with a quiet curtain, not another large print", () => {
    const c = room({ ageStage: "older", budget: "generous", moods: ["romantic"] });
    const recs = recommend("fabric", c, { wallpaper: "wp-toile-des-jardins" });
    expect(recs[0].material.scale === "plain" || recs[0].material.scale === "small").toBe(true);
    const chintz = scoreMaterial(byId("fb-chintz-fleuri"), c, { wallpaper: "wp-toile-des-jardins" });
    expect(chintz.cautions.join(" ")).toMatch(/compete/);
  });

  it("never recommends a nursery-only paper first for a teenager", () => {
    const recs = recommend("wallpaper", room({ ageStage: "teen", moods: ["whimsical"] }));
    expect(recs[0].material.ages).toContain("teen");
  });
});

describe("quantities", () => {
  it("counts wallpaper rolls with a spare", () => {
    // 3.6 × 3.0 m room, 2.5 m ceiling: perimeter 13.2 m → 26 drops;
    // plain stripe: drop 2.6 m → 3 per roll → 9 rolls + 1 spare
    expect(wallpaperRolls(room(), 0).amount).toBe(10);
    // a 64 cm repeat leaves only 3 drops per roll still (3.24 m drops)
    expect(wallpaperRolls(room(), 64).amount).toBe(10);
  });

  it("estimates paint for two coats", () => {
    // 13.2 × 2.5 = 33 m², minus window 1.56 and door 1.9 → 29.54 m² → 4.9 L → 2 tins
    expect(paintTins(room()).amount).toBe(2);
  });

  it("measures curtain fabric at proper fullness", () => {
    // 120 cm window → 160 cm pole × 2.25 = 360 cm → 3 widths × 2.6 m = 7.8 m
    expect(curtainFabric(room(), 0).amount).toBe(7.8);
    expect(curtainFabric(room({ windows: 0 }), 0).amount).toBe(0);
  });
});
