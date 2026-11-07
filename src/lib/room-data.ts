import { validateConsultation, type Consultation } from "./consultation";
import { MATERIALS, type Category } from "./materials";
import type { Selections } from "./recommend";

/** Reads a saved consultation back, refusing anything that no longer validates. */
export function parseConsultation(json: string): Consultation | null {
  try {
    const result = validateConsultation(JSON.parse(json));
    return result.ok ? result.value : null;
  } catch {
    return null;
  }
}

/** Reads saved selections, keeping only materials that still exist in the library. */
export function parseSelections(json: string): Selections {
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const out: Selections = {};
    for (const [cat, id] of Object.entries(raw ?? {})) {
      if (typeof id === "string" && MATERIALS.some((m) => m.id === id && m.category === cat)) {
        out[cat as Category] = id;
      }
    }
    return out;
  } catch {
    return {};
  }
}
