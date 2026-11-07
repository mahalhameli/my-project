import { NextResponse, type NextRequest } from "next/server";
import { photoData } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

/** A member's own photo. Nobody else can open it, even with the address. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/photos/[photoId]">) {
  const userId = await getSessionUserId();
  if (!userId) return new NextResponse("Not found", { status: 404 });
  const { photoId } = await ctx.params;
  const photo = await photoData(userId, photoId);
  if (!photo) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(Buffer.from(photo.data_b64, "base64")), {
    headers: {
      "Content-Type": photo.mime,
      // The original photo never changes (the Golden Rule), so the browser may keep it,
      // but only in this member's own browser.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
