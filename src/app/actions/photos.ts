"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  deletePhoto,
  deleteVersion,
  findPhoto,
  findRoom,
  insertVersion,
  savePhotoRegions,
  updateRoomSelections,
} from "@/lib/db";
import { MATERIALS } from "@/lib/materials";
import { isConvexQuad, parseRegions, REGION_INFO, sanitizeLayers, validateRegions } from "@/lib/photo-model";
import { parseSelections } from "@/lib/room-data";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** Save the outlines of the room; `lock` fixes them so they can't move by accident. */
export async function saveOutlines(photoId: string, regionsJson: string, lock: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const photo = await findPhoto(user.id, photoId);
  if (!photo) return { ok: false, error: "That photo could not be found." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(regionsJson);
  } catch {
    return { ok: false, error: "The outlines could not be read." };
  }
  const result = validateRegions(parsed);
  if (!result.ok) return result;
  for (const r of result.value) {
    if (REGION_INFO[r.kind].corners && !isConvexQuad(r.points)) {
      return { ok: false, error: `The corners of “${r.label}” cross over. Please drag them into place.` };
    }
  }
  if (lock && !result.value.some((r) => r.kind === "wall" || r.kind === "floor")) {
    return { ok: false, error: "Please outline at least one wall or the floor before locking." };
  }
  await savePhotoRegions(user.id, photoId, result.value, lock);
  refresh();
  return { ok: true };
}

const THUMB_PATTERN = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

/**
 * Save the current look as a version, and make it the room's scheme, so the
 * recommendations and estimate follow what the client sees in their photo.
 */
export async function saveVersion(
  photoId: string,
  layersJson: string,
  name: string,
  thumbnail: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const photo = await findPhoto(user.id, photoId);
  if (!photo) return { ok: false, error: "That photo could not be found." };
  if (!photo.locked) return { ok: false, error: "Please lock the outlines first." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(layersJson);
  } catch {
    return { ok: false, error: "The scheme could not be read." };
  }
  const layers = sanitizeLayers(parsed, parseRegions(photo.regions));
  const thumb = thumbnail.length <= 250_000 && THUMB_PATTERN.test(thumbnail) ? thumbnail : "";
  const id = randomUUID();
  const label = name.trim().slice(0, 60) || "A version";
  const ok = await insertVersion({ id, photoId, userId: user.id, name: label, layers, thumbnail: thumb });
  if (!ok) return { ok: false, error: "The version could not be saved." };

  // Carry the choices into the room's scheme.
  const room = await findRoom(user.id, photo.room_id);
  if (room) {
    const selections = parseSelections(room.selections);
    const firstWall = Object.values(layers.walls).find((id) => id);
    const wallMaterial = MATERIALS.find((m) => m.id === firstWall);
    if (wallMaterial) selections[wallMaterial.category] = wallMaterial.id;
    if (layers.floor) selections.flooring = layers.floor;
    if (layers.curtains) selections.fabric = layers.curtains;
    await updateRoomSelections(user.id, room.id, selections);
  }
  refresh();
  return { ok: true, id };
}

export async function removeVersion(versionId: string): Promise<void> {
  const user = await requireUser();
  await deleteVersion(user.id, versionId);
  refresh();
}

export async function removePhoto(formData: FormData): Promise<void> {
  const user = await requireUser();
  const photoId = String(formData.get("photoId") ?? "");
  const photo = await findPhoto(user.id, photoId);
  if (!photo) return;
  await deletePhoto(user.id, photoId);
  redirect(`/atelier/pieces/${photo.room_id}`);
}
