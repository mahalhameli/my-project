"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "./PhotoStudio.module.css";

const MAX_SIDE = 2000;

/** Straighten (using the camera's orientation), shrink and compress a photo before upload. */
async function prepare(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "This photo's format can't be opened here. Please choose a JPEG or PNG. On an iPhone: Settings → Camera → Formats → Most Compatible.",
    );
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("The photo could not be prepared. Please try another.");
  return { blob, width, height };
}

export function PhotoUpload({ roomId, disabled }: { roomId: string; disabled?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const { blob, width, height } = await prepare(file);
      const form = new FormData();
      form.append("photo", blob, "room.jpg");
      form.append("width", String(width));
      form.append("height", String(height));
      const res = await fetch(`/api/rooms/${roomId}/photos`, { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error ?? "The photo could not be uploaded. Please try again.");
      router.push(`/atelier/pieces/${roomId}/photos/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={styles.upload}>
      <input
        ref={input}
        id={`upload-${roomId}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="visually-hidden"
        disabled={disabled || busy}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <label htmlFor={`upload-${roomId}`} className={`btn btn-seal ${disabled || busy ? styles.disabledLabel : ""}`} aria-disabled={disabled || busy}>
        {busy ? "Uploading your photo…" : "Upload a photo of the room"}
      </label>
      <p className={styles.uploadHint}>
        Stand in a corner or a doorway and take the photo straight on, in daylight, with as much of the walls, floor and
        windows in view as you can.
      </p>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
