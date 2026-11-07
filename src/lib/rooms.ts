import type { ComponentType, SVGProps } from "react";
import {
  ChildrenBedroom,
  EnglishGarden,
  Entrance,
  FrenchGarden,
  Kitchen,
  ParentsSuite,
  Playroom,
  Wardrobe,
} from "@/components/Engravings";

export type Room = {
  slug: string;
  french: string;
  english: string;
  description: string;
  Illustration: ComponentType<SVGProps<SVGSVGElement>>;
};

export const ROOMS: Room[] = [
  {
    slug: "chambre-enfant",
    french: "La Chambre d'Enfant",
    english: "Children's Bedroom",
    description:
      "Gentle, washable and safe, with a room that grows from nursery to schoolroom to the teenage years.",
    Illustration: ChildrenBedroom,
  },
  {
    slug: "suite-parentale",
    french: "La Suite Parentale",
    english: "Parents' Suite",
    description:
      "A restful retreat: layered fabrics, soft light, and an en-suite that feels like a private hotel.",
    Illustration: ParentsSuite,
  },
  {
    slug: "salle-de-jeux",
    french: "La Salle de Jeux",
    english: "Playroom",
    description:
      "Hard-wearing, cheerful and full of storage, zoned for play, reading and craft.",
    Illustration: Playroom,
  },
  {
    slug: "cuisine",
    french: "La Cuisine",
    english: "Kitchen",
    description:
      "Cabinetry, splashback tiles, flooring and hardware, with a layout that cooks as well as it looks.",
    Illustration: Kitchen,
  },
  {
    slug: "garde-robe",
    french: "La Garde-Robe",
    english: "Wardrobe & Dressing Room",
    description:
      "Fitted joinery with the right hanging heights, drawers and shelves for the way you dress.",
    Illustration: Wardrobe,
  },
  {
    slug: "entree",
    french: "L'Entrée",
    english: "Entrance & Hallway",
    description:
      "First impressions: durable floors, clever storage and lighting that welcomes you home.",
    Illustration: Entrance,
  },
  {
    slug: "jardin-anglais",
    french: "Le Jardin Anglais",
    english: "English Landscape Garden",
    description:
      "Informal drifts of planting, rose arches, meadow and winding paths, the romance of the countryside.",
    Illustration: EnglishGarden,
  },
  {
    slug: "jardin-a-la-francaise",
    french: "Le Jardin à la Française",
    english: "French Formal Garden",
    description:
      "Parterres, clipped box and yew, gravel allées and the quiet order of perfect symmetry.",
    Illustration: FrenchGarden,
  },
];
