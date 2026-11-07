"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { validateConsultation } from "@/lib/consultation";
import {
  countRooms,
  deleteRoom as deleteRoomRow,
  findRoom,
  insertRoom,
  updateRoomSelections,
} from "@/lib/db";
import { MATERIALS, type Category } from "@/lib/materials";
import { ROOM_LIMIT, planInfo } from "@/lib/plans";
import { parseSelections } from "@/lib/room-data";

export type ConsultationFormState = { error?: string };

export async function createChildrenRoom(
  _prev: ConsultationFormState,
  formData: FormData,
): Promise<ConsultationFormState> {
  const user = await requireUser();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "We couldn't read your answers. Please try again." };
  }
  const result = validateConsultation(payload);
  if (!result.ok) return { error: result.error };

  const limit = ROOM_LIMIT[user.plan];
  if (countRooms(user.id) >= limit) {
    return {
      error: `Your ${planInfo(user.plan).french} membership includes ${limit} room. Remove your existing room from Mon Atelier, or become a Membre for unlimited rooms.`,
    };
  }

  const id = randomUUID();
  insertRoom({
    id,
    userId: user.id,
    type: "chambre-enfant",
    name: result.value.roomName || "La Chambre d'Enfant",
    consultation: result.value,
  });
  redirect(`/atelier/pieces/${id}`);
}

const CATEGORY_IDS: Category[] = ["wallpaper", "paint", "fabric", "flooring"];

/** Choose a material for a room, or un-choose it if it is already chosen. */
export async function toggleSelection(formData: FormData): Promise<void> {
  const user = await requireUser();
  const roomId = String(formData.get("roomId") ?? "");
  const category = String(formData.get("category") ?? "") as Category;
  const materialId = String(formData.get("materialId") ?? "");

  const room = findRoom(user.id, roomId);
  if (!room || !CATEGORY_IDS.includes(category)) return;
  const material = MATERIALS.find((m) => m.id === materialId && m.category === category);
  if (!material) return;

  const selections = parseSelections(room.selections);
  if (selections[category] === materialId) delete selections[category];
  else selections[category] = materialId;

  updateRoomSelections(user.id, roomId, selections);
  refresh();
}

export async function removeRoom(formData: FormData): Promise<void> {
  const user = await requireUser();
  deleteRoomRow(user.id, String(formData.get("roomId") ?? ""));
  redirect("/atelier");
}
