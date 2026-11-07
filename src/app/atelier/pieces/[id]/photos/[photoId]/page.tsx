import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { removePhoto } from "@/app/actions/photos";
import { PhotoStudio, type StudioVersion } from "@/components/PhotoStudio";
import { requireUser } from "@/lib/auth";
import { findPhoto, findRoom, listVersions } from "@/lib/db";
import type { Category } from "@/lib/materials";
import { EMPTY_LAYERS, parseRegions, sanitizeLayers, type Layers } from "@/lib/photo-model";
import { recommend } from "@/lib/recommend";
import { parseConsultation, parseSelections } from "@/lib/room-data";

export const metadata: Metadata = { title: "Your room in a photo" };

export default function PhotoPage({ params }: PageProps<"/atelier/pieces/[id]/photos/[photoId]">) {
  return (
    <section className="container" style={{ padding: "clamp(24px, 4vw, 56px) var(--gutter)" }}>
      <Suspense fallback={<p className="center lede">Bringing out your photo…</p>}>
        <Studio params={params} />
      </Suspense>
    </section>
  );
}

async function Studio({ params }: { params: Promise<{ id: string; photoId: string }> }) {
  const user = await requireUser();
  const { id, photoId } = await params;
  const [room, photo] = await Promise.all([findRoom(user.id, id), findPhoto(user.id, photoId)]);
  if (!room || !photo || photo.room_id !== room.id) notFound();
  const c = parseConsultation(room.consultation);
  if (!c) notFound();

  const regions = parseRegions(photo.regions);
  const versionRows = await listVersions(user.id, photo.id);
  const versions: StudioVersion[] = versionRows.map((v) => {
    let layers: Layers = EMPTY_LAYERS;
    try {
      layers = sanitizeLayers(JSON.parse(v.layers), regions);
    } catch {}
    return { id: v.id, name: v.name, layers, thumbnail: v.thumbnail };
  });

  const selections = parseSelections(room.selections);
  const recommended: Partial<Record<Category, string[]>> = {};
  for (const cat of ["wallpaper", "paint", "fabric", "flooring"] as Category[]) {
    recommended[cat] = recommend(cat, c, selections).map((r) => r.material.id);
  }

  // Start from the latest saved version, or else from the room's scheme.
  const latest = versions[versions.length - 1];
  const wallChoice = selections.wallpaper ?? selections.paint ?? recommended.wallpaper?.[0] ?? null;
  const initialLayers: Layers =
    latest?.layers ??
    sanitizeLayers(
      {
        walls: Object.fromEntries(regions.filter((r) => r.kind === "wall").map((r) => [r.id, wallChoice])),
        floor: selections.flooring ?? null,
        curtains: selections.fabric ?? null,
      },
      regions,
    );

  return (
    <>
      <p style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 600 }}>
        <Link href={`/atelier/pieces/${room.id}`} style={{ textDecoration: "none" }}>
          ← {room.name}
        </Link>
      </p>
      <header className="center" style={{ marginBottom: 24 }}>
        <p className="smallcaps">Votre Pièce en Photo</p>
        <h1>
          {room.name}
          <span className="translation">your room, as it really is</span>
        </h1>
      </header>

      <PhotoStudio
        photoId={photo.id}
        photoUrl={`/api/photos/${photo.id}`}
        width={photo.width}
        height={photo.height}
        initialRegions={regions}
        locked={photo.locked}
        versions={versions}
        initialLayers={initialLayers}
        recommended={recommended}
        defaults={{
          lengthCm: Math.round(c.lengthM * 100),
          widthCm: Math.round(c.widthM * 100),
          ceilingCm: Math.round(c.ceilingM * 100),
          windowWidthCm: c.windowWidthCm || 120,
        }}
      />

      <form action={removePhoto} style={{ textAlign: "center", marginTop: 32 }}>
        <input type="hidden" name="photoId" value={photo.id} />
        <button type="submit" className="btn btn-quiet">
          Delete this photo
        </button>
      </form>
    </>
  );
}
