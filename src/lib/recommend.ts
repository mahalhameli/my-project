/**
 * The designer's judgement, written down.
 *
 * Every material is weighed against the client's consultation using the
 * rules a professional decorator applies, and each recommendation carries
 * the reasons for it (and any gentle cautions) in plain English.
 */
import type { Budget, Consultation } from "./consultation";
import { MATERIALS, type Category, type Material } from "./materials";

export type Selections = Partial<Record<Category, string>>;

export type Recommendation = {
  material: Material;
  score: number;
  reasons: string[];
  cautions: string[];
};

const BUDGET_TIER: Record<Budget, 1 | 2 | 3> = { modest: 1, considered: 2, generous: 3 };

const AGE_WORDS: Record<string, string> = {
  nursery: "a nursery",
  young: "a young child",
  older: "an older child",
  teen: "a teenager",
};

export function floorArea(c: Consultation): number {
  return c.lengthM * c.widthM;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** How alike two colours look (0 = identical). Simple and good enough for pairing. */
export function colourDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export function scoreMaterial(m: Material, c: Consultation, selections: Selections = {}): Recommendation {
  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];
  const isSurface = m.category === "wallpaper" || m.category === "paint";
  const littleOnes = c.ageStage === "nursery" || c.ageStage === "young";

  // 1. Age: does it suit the child, and will it grow with them?
  if (m.ages.includes(c.ageStage)) {
    score += 1;
    if (m.ages.length === 4) {
      score += 0.5;
      reasons.push("It will grow with the child, from nursery to teenage years.");
    }
  } else {
    score -= 4;
    cautions.push(`Usually better suited to ${joinWords(m.ages.map((a) => AGE_WORDS[a]))} than ${AGE_WORDS[c.ageStage]}.`);
  }

  // 2. Mood
  const matched = m.moods.filter((mood) => c.moods.includes(mood));
  if (matched.length) {
    score += matched.length * 2;
    reasons.push(`It has the ${joinWords(matched)} feeling you asked for.`);
  }

  // 3. Light: undertone against the direction the window faces
  if (m.scale === "plain" || isSurface) {
    if (c.orientation === "north") {
      if (m.undertone === "warm") {
        score += 2;
        reasons.push("Its warm undertone balances the cool, even light of a north-facing room.");
      } else if (m.undertone === "cool") {
        score -= 2;
        cautions.push("Cool tones can feel chilly in north light. Test a sample on the wall first.");
      }
    } else if (c.orientation === "south" && m.undertone === "cool") {
      score += 1;
      reasons.push("A cooler tone keeps strong southern light feeling fresh rather than hot.");
    } else if (c.orientation === "east" && m.undertone === "warm") {
      score += 1;
      reasons.push("Warmth here carries the room through the cooler afternoons of an east-facing room.");
    } else if (c.orientation === "west" && m.undertone !== "cool") {
      score += 0.5;
    }
    if (c.light === "dim" && m.category === "paint" && m.id === "pt-bleu-de-nuit") {
      score -= 1;
      cautions.push("In a dim room a deep colour will read darker still. Lovely if you want a cocoon.");
    }
  }

  // 4. Practicality for little hands
  if (isSurface && m.washability) {
    if (m.washability === "scrubbable") {
      score += littleOnes ? 2 : 1;
      reasons.push("It is scrubbable, so crayon and sticky fingers wipe away.");
    } else if (m.washability === "spongeable") {
      score -= littleOnes ? 3 : 1;
      cautions.push("Only spongeable, not ideal where little hands reach. Consider it above a dado rail.");
    }
  }
  if (m.category === "fabric" && m.washability === "washable") {
    score += 1;
    reasons.push("It can be washed, which matters in a child's room.");
  }

  // 5. Allergies
  if (c.allergies && (m.category === "fabric" || m.category === "flooring")) {
    if (m.allergyFriendly) {
      score += 1;
      reasons.push("Easy to keep dust-free, a good choice with allergies.");
    } else {
      score -= 6;
      cautions.push("It holds dust, so I'd avoid it with allergies in the family.");
    }
  }

  // 6. Budget
  const over = m.priceTier - BUDGET_TIER[c.budget];
  if (over === 1) {
    score -= 2;
    cautions.push("A little above your budget. Worth it on a single feature wall?");
  } else if (over >= 2) {
    score -= 4;
    cautions.push("Well above the budget you gave.");
  } else if (over < 0 && c.budget === "modest") {
    score += 0.5;
  }

  // 7. Scale against the room itself
  if (m.category === "wallpaper") {
    const area = floorArea(c);
    if (m.scale === "large") {
      if (area < 9) {
        score += 1;
        reasons.push("A bold paper in a small room is charming, far better than a timid one.");
      }
      if (c.ceilingM >= 2.8) {
        score += 1;
        reasons.push("Your generous ceiling height lets a large repeat show itself fully.");
      }
    }
    if (m.pattern.kind === "stripe" && c.ceilingM < 2.4) {
      score += 1.5;
      reasons.push("Vertical stripes will lift your lower ceiling.");
    }
    if (c.sharedBy > 1 && (m.moods.includes("classic") || m.moods.includes("calm"))) {
      score += 1;
      reasons.push("A gentle, even-handed design suits a room shared by more than one child.");
    }
  }

  // 8. Flooring for crawling and play
  if (m.category === "flooring") {
    if (c.ageStage === "nursery" && m.id === "fl-jonc-de-mer") {
      score -= 2;
    }
    if (littleOnes && (m.id === "fl-linoleum" || m.id === "fl-parquet-chene")) {
      score += 1;
      reasons.push("Wipes clean after paint, glue and spilt milk.");
    }
    if (c.ageStage === "nursery" && m.id === "fl-moquette-laine" && !c.allergies) {
      score += 1.5;
      reasons.push("Soft and warm for crawling and floor play.");
    }
  }

  // 9. Harmony with what the client has already chosen
  const paper = selections.wallpaper ? MATERIALS.find((x) => x.id === selections.wallpaper) : undefined;
  if (paper && m.category === "fabric") {
    if (paper.scale === "large" && (m.scale === "large" || m.scale === "medium")) {
      score -= 3;
      cautions.push(`It would compete with the large pattern of ${paper.name}. Choose one star of the show.`);
    } else if (m.scale === "plain" || m.scale === "small") {
      score += 2;
      reasons.push(`A quieter companion to ${paper.name}: one bold pattern and one calm one let both breathe.`);
    }
    if (paper.pattern.kind === m.pattern.kind && m.scale !== "plain") {
      score -= 1;
      cautions.push(`The same kind of pattern as ${paper.name}. Mixing pattern types looks more collected.`);
    }
  }
  if (paper && m.category === "paint") {
    const closest = Math.min(...paper.colours.map((col) => colourDistance(col, m.colours[0])));
    if (closest < 40) {
      score += 2.5;
      reasons.push(`It picks out a colour from ${paper.name}, perfect for woodwork, a ceiling or below a dado.`);
    } else if (paper.undertone !== "neutral" && m.undertone !== "neutral" && paper.undertone !== m.undertone) {
      score -= 1;
      cautions.push(`Its undertone fights a little with ${paper.name}.`);
    }
  }

  return { material: m, score, reasons, cautions };
}

export function recommend(
  category: Category,
  c: Consultation,
  selections: Selections = {},
  limit = 3,
): Recommendation[] {
  return MATERIALS.filter((m) => m.category === category)
    .map((m) => scoreMaterial(m, c, selections))
    .sort((a, b) => b.score - a.score || a.material.unitPrice - b.material.unitPrice)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  Quantities: how much to order                                      */
/* ------------------------------------------------------------------ */

export const ROLL_LENGTH_M = 10.05;
export const ROLL_WIDTH_M = 0.52;
export const PAINT_COVERAGE_M2_PER_L = 12;
export const TIN_LITRES = 2.5;
export const FABRIC_WIDTH_CM = 137;
export const CURTAIN_FULLNESS = 2.25;

export type Quantity = { amount: number; unit: string; detail: string };

export function wallPerimeter(c: Consultation): number {
  return 2 * (c.lengthM + c.widthM);
}

export function wallpaperRolls(c: Consultation, repeatCm: number): Quantity {
  const dropLength = c.ceilingM + repeatCm / 100 + 0.1; // trim allowance
  const dropsPerRoll = Math.floor(ROLL_LENGTH_M / dropLength);
  const drops = Math.ceil(wallPerimeter(c) / ROLL_WIDTH_M);
  const rolls = Math.ceil(drops / Math.max(1, dropsPerRoll)) + 1;
  return {
    amount: rolls,
    unit: rolls === 1 ? "roll" : "rolls",
    detail: `${drops} drops at ${dropsPerRoll} per roll, plus one spare roll from the same batch.`,
  };
}

export function paintableArea(c: Consultation): number {
  const windowArea = c.windows * (c.windowWidthCm / 100) * 1.3;
  const doorArea = c.doors * 1.9;
  return Math.max(0, wallPerimeter(c) * c.ceilingM - windowArea - doorArea);
}

export function paintTins(c: Consultation): Quantity {
  const area = paintableArea(c);
  const litres = (area * 2) / PAINT_COVERAGE_M2_PER_L;
  const tins = Math.max(1, Math.ceil(litres / TIN_LITRES));
  return {
    amount: tins,
    unit: tins === 1 ? "tin" : "tins",
    detail: `About ${area.toFixed(1)} m² of wall, two coats, around ${litres.toFixed(1)} litres.`,
  };
}

export function curtainDropM(c: Consultation): number {
  // Pole about 15 cm above a standard window frame; floor-length, just kissing the floor.
  return Math.min(2.3, c.ceilingM - 0.15);
}

export function curtainFabric(c: Consultation, repeatCm: number): Quantity {
  if (c.windows === 0) return { amount: 0, unit: "metres", detail: "No windows to dress." };
  const poleCm = c.windowWidthCm + 40; // 20 cm beyond the frame each side
  const widths = Math.ceil((poleCm * CURTAIN_FULLNESS) / FABRIC_WIDTH_CM);
  const cutLengthM = curtainDropM(c) + 0.3 + repeatCm / 100; // hems and heading, plus pattern match
  const metres = Math.ceil(widths * cutLengthM * c.windows * 10) / 10;
  return {
    amount: metres,
    unit: "metres",
    detail: `${widths} fabric widths per window for a ${poleCm} cm pole at ${CURTAIN_FULLNESS}× fullness, floor-length.`,
  };
}

export function flooringArea(c: Consultation): Quantity {
  const m2 = Math.ceil(floorArea(c) * 1.1 * 10) / 10;
  return { amount: m2, unit: "m²", detail: "Your floor area plus 10% for cutting." };
}

export function quantityFor(m: Material, c: Consultation): Quantity {
  switch (m.category) {
    case "wallpaper":
      return wallpaperRolls(c, m.repeatCm);
    case "paint":
      return paintTins(c);
    case "fabric":
      return curtainFabric(c, m.repeatCm);
    case "flooring":
      return flooringArea(c);
  }
}

export function estimatedCost(m: Material, c: Consultation): number {
  return Math.round(quantityFor(m, c).amount * m.unitPrice);
}

/* ------------------------------------------------------------------ */
/*  The designer's general advice for this particular room             */
/* ------------------------------------------------------------------ */

export function roomAdvice(c: Consultation): string[] {
  const advice: string[] = [
    "Anchor wardrobes, bookcases and chests of drawers to the wall: a quiet rule I never break in a child's room.",
    "Choose curtains on a pole that you draw by hand, with no cords or chains for little ones to reach.",
  ];
  if (c.ageStage === "nursery") {
    advice.push("Line the curtains with blackout so naps happen in daylight too.");
    advice.push("Keep the cot away from the window, radiators and any hanging pictures.");
  }
  if (c.ageStage === "nursery" || c.ageStage === "young") {
    advice.push("Choose furniture with rounded corners, and keep the floor clear down the middle for play.");
  }
  if (c.ageStage === "older" || c.ageStage === "teen") {
    advice.push("Give them a proper desk with a good task lamp, and a wall where they can pin their own things.");
  }
  if (c.sharedBy > 1) {
    advice.push("In a shared room, give each child their own bedside light, shelf and pinboard, so each has a corner of their own.");
  }
  if (c.timesOfUse.includes("evening") || c.timesOfUse.includes("night")) {
    advice.push("Layer the lighting: a soft overhead light, a reading lamp by the bed and a dim night light.");
  }
  if (floorArea(c) < 9) {
    advice.push("In a compact room, a bed with drawers beneath and wall-hung shelves keep the floor free.");
  }
  return advice;
}
