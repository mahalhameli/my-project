/**
 * The Consultation for a child's bedroom: the questions a designer asks
 * before proposing anything. Shared by the form (client) and the server.
 */

export const AGE_STAGES = [
  { id: "nursery", label: "Nursery", detail: "0–3 years" },
  { id: "young", label: "Young child", detail: "4–8 years" },
  { id: "older", label: "Older child", detail: "9–12 years" },
  { id: "teen", label: "Teenager", detail: "13 years and over" },
] as const;
export type AgeStage = (typeof AGE_STAGES)[number]["id"];

export const ORIENTATIONS = [
  { id: "north", label: "North", detail: "Soft, cool, even light all day" },
  { id: "east", label: "East", detail: "Bright mornings, cooler afternoons" },
  { id: "south", label: "South", detail: "Warm, strong light for most of the day" },
  { id: "west", label: "West", detail: "Gentle mornings, golden evenings" },
] as const;
export type Orientation = (typeof ORIENTATIONS)[number]["id"];

export const LIGHT_LEVELS = [
  { id: "bright", label: "Bright" },
  { id: "moderate", label: "Moderate" },
  { id: "dim", label: "Rather dim" },
] as const;
export type LightLevel = (typeof LIGHT_LEVELS)[number]["id"];

export const TIMES_OF_USE = [
  { id: "morning", label: "Mornings" },
  { id: "afternoon", label: "Afternoons" },
  { id: "evening", label: "Evenings" },
  { id: "night", label: "Mostly for sleeping" },
] as const;
export type TimeOfUse = (typeof TIMES_OF_USE)[number]["id"];

export const MOODS = [
  { id: "calm", label: "Calm" },
  { id: "playful", label: "Playful" },
  { id: "whimsical", label: "Whimsical" },
  { id: "cosy", label: "Cosy" },
  { id: "fresh", label: "Fresh" },
  { id: "romantic", label: "Romantic" },
  { id: "adventurous", label: "Adventurous" },
  { id: "classic", label: "Classic" },
] as const;
export type Mood = (typeof MOODS)[number]["id"];
export const MAX_MOODS = 3;

export const BUDGETS = [
  { id: "modest", label: "Modest", detail: "Beautiful choices that are kind to the purse" },
  { id: "considered", label: "Considered", detail: "Spend where it shows and lasts" },
  { id: "generous", label: "Generous", detail: "The very finest papers and fabrics" },
] as const;
export type Budget = (typeof BUDGETS)[number]["id"];

export type Consultation = {
  roomName: string;
  ageStage: AgeStage;
  sharedBy: number; // children sharing the room
  allergies: boolean;
  lengthM: number;
  widthM: number;
  ceilingM: number;
  windows: number;
  windowWidthCm: number;
  doors: number;
  orientation: Orientation;
  light: LightLevel;
  timesOfUse: TimeOfUse[];
  moods: Mood[];
  budget: Budget;
  keep: string;
};

export const DEFAULT_CONSULTATION: Consultation = {
  roomName: "",
  ageStage: "young",
  sharedBy: 1,
  allergies: false,
  lengthM: 3.6,
  widthM: 3.0,
  ceilingM: 2.5,
  windows: 1,
  windowWidthCm: 120,
  doors: 1,
  orientation: "north",
  light: "moderate",
  timesOfUse: ["night"],
  moods: [],
  budget: "considered",
  keep: "",
};

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as T[number]["id"][];

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function num(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export type ValidationResult =
  | { ok: true; value: Consultation }
  | { ok: false; error: string };

/** Checks every answer. Used on the server, so it never trusts the browser. */
export function validateConsultation(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "The consultation could not be read." };
  }
  const i = input as Record<string, unknown>;

  const roomName = String(i.roomName ?? "").trim().slice(0, 60);
  if (!oneOf(i.ageStage, ids(AGE_STAGES))) return { ok: false, error: "Please choose the child's age." };
  const sharedBy = num(i.sharedBy, 1, 4);
  if (sharedBy === null) return { ok: false, error: "Please say how many children share the room (1 to 4)." };

  const lengthM = num(i.lengthM, 1.5, 12);
  const widthM = num(i.widthM, 1.5, 12);
  if (lengthM === null || widthM === null) {
    return { ok: false, error: "The room's length and width should each be between 1.5 and 12 metres." };
  }
  const ceilingM = num(i.ceilingM, 2, 5);
  if (ceilingM === null) return { ok: false, error: "The ceiling height should be between 2 and 5 metres." };
  const windows = num(i.windows, 0, 6);
  const doors = num(i.doors, 1, 4);
  if (windows === null || doors === null) {
    return { ok: false, error: "Please check the number of windows (0–6) and doors (1–4)." };
  }
  const windowWidthCm = windows === 0 ? 0 : num(i.windowWidthCm, 40, 400);
  if (windowWidthCm === null) return { ok: false, error: "The window width should be between 40 and 400 cm." };

  if (!oneOf(i.orientation, ids(ORIENTATIONS))) return { ok: false, error: "Please choose which way the window faces." };
  if (!oneOf(i.light, ids(LIGHT_LEVELS))) return { ok: false, error: "Please describe the natural light." };

  const timesOfUse = Array.isArray(i.timesOfUse)
    ? [...new Set(i.timesOfUse.filter((t): t is TimeOfUse => oneOf(t, ids(TIMES_OF_USE))))]
    : [];
  if (timesOfUse.length === 0) return { ok: false, error: "Please choose when the room is used most." };

  const moods = Array.isArray(i.moods)
    ? [...new Set(i.moods.filter((m): m is Mood => oneOf(m, ids(MOODS))))]
    : [];
  if (moods.length === 0) return { ok: false, error: "Please choose at least one mood word." };
  if (moods.length > MAX_MOODS) return { ok: false, error: `Please choose no more than ${MAX_MOODS} mood words.` };

  if (!oneOf(i.budget, ids(BUDGETS))) return { ok: false, error: "Please choose a budget." };
  const keep = String(i.keep ?? "").trim().slice(0, 500);

  return {
    ok: true,
    value: {
      roomName,
      ageStage: i.ageStage,
      sharedBy: Math.round(sharedBy),
      allergies: i.allergies === true,
      lengthM,
      widthM,
      ceilingM,
      windows: Math.round(windows),
      windowWidthCm: Math.round(windowWidthCm),
      doors: Math.round(doors),
      orientation: i.orientation,
      light: i.light,
      timesOfUse,
      moods,
      budget: i.budget,
      keep,
    },
  };
}

export function labelOf<T extends readonly { id: string; label: string }[]>(list: T, id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}
