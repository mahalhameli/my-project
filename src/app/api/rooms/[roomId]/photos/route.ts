import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { insertPhotoWithinLimit } from "@/lib/db";
import { MAX_PHOTOS_PER_ROOM } from "@/lib/photo-model";
import { getSessionUserId } from "@/lib/session";

const MAX_BYTES = 3.5 * 1024 * 1024; // photos are resized in the browser before upload
const MAX_SIDE = 4096;

function isJpeg(b: Buffer) {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}
function isPng(b: Buffer) {
  return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}
function isWebp(b: Buffer) {
  return b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
}

/** Upload a photo of one of the member's own rooms. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/rooms/[roomId]/photos">) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const { roomId } = await ctx.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The photo could not be read." }, { status: 400 });
  }
  const file = form.get("photo");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 200 || height < 200 || width > MAX_SIDE || height > MAX_SIDE) {
    return NextResponse.json({ error: "That photo is too small to work with. Please use a clearer one." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = isJpeg(bytes) ? "image/jpeg" : isPng(bytes) ? "image/png" : isWebp(bytes) ? "image/webp" : null;
  if (!mime) return NextResponse.json({ error: "Please upload a JPEG, PNG or WebP photo." }, { status: 415 });

  const id = randomUUID();
  const added = await insertPhotoWithinLimit({
    id,
    userId,
    roomId,
    mime,
    dataB64: bytes.toString("base64"),
    width,
    height,
    limit: MAX_PHOTOS_PER_ROOM,
  });
  if (!added) {
    return NextResponse.json(
      { error: `Each room can hold ${MAX_PHOTOS_PER_ROOM} photos. Remove one to add another.` },
      { status: 409 },
    );
  }
  return NextResponse.json({ id }, { status: 201 });
}
