import type { Plan } from "./db";

export type PlanInfo = {
  id: Plan;
  french: string;
  english: string;
  price: string;
  cadence: string;
  summary: string;
  features: string[];
  featured?: boolean;
};

/* Prices are placeholders until payments are connected (Phase 5). */
export const PLANS: PlanInfo[] = [
  {
    id: "visiteur",
    french: "Visiteur",
    english: "Visitor",
    price: "Free",
    cadence: "always",
    summary: "A first taste of the atelier.",
    features: [
      "One room",
      "A selection from the material library",
      "The Consultation questionnaire",
      "Mood boards (watermarked)",
    ],
  },
  {
    id: "membre",
    french: "Membre",
    english: "Member",
    price: "AED 49",
    cadence: "per month",
    summary: "For the whole house, room by room.",
    features: [
      "Unlimited rooms",
      "The full material library",
      "Room planner with layout suggestions",
      "3D room view",
      "Printable specification sheets",
    ],
    featured: true,
  },
  {
    id: "atelier",
    french: "Atelier",
    english: "Studio",
    price: "AED 99",
    cadence: "per month",
    summary: "The complete designer's toolkit.",
    features: [
      "Everything in Membre",
      "“See it in my room” photo overlay",
      "Garden design: English & French",
      "Harmony checker for every scheme",
      "Early access to new collections",
    ],
  },
];

export function planInfo(id: Plan): PlanInfo {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** How many rooms each membership may keep. */
export const ROOM_LIMIT: Record<Plan, number> = {
  visiteur: 1,
  membre: Infinity,
  atelier: Infinity,
};
