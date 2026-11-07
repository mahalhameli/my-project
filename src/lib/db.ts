import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * The database.
 *
 * Online, the app uses PostgreSQL (for example Supabase), reached through the
 * DATABASE_URL setting. On a developer's own computer, with no DATABASE_URL,
 * it uses PGlite, a small copy of PostgreSQL that keeps its data in ./data,
 * so the very same SQL runs in both places.
 */

type Params = (string | number | boolean | null)[];

interface Driver {
  query<T>(text: string, params?: Params): Promise<T[]>;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    plan          TEXT NOT NULL DEFAULT 'visiteur',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

  CREATE TABLE IF NOT EXISTS rooms (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    name          TEXT NOT NULL,
    consultation  TEXT NOT NULL,
    selections    TEXT NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS rooms_by_user ON rooms (user_id, created_at);

  CREATE TABLE IF NOT EXISTS photos (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id       TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    mime          TEXT NOT NULL,
    data_b64      TEXT NOT NULL,
    width         INTEGER NOT NULL,
    height        INTEGER NOT NULL,
    regions       TEXT NOT NULL DEFAULT '[]',
    locked        BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS photos_by_room ON photos (room_id, created_at);

  CREATE TABLE IF NOT EXISTS photo_versions (
    id            TEXT PRIMARY KEY,
    photo_id      TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    layers        TEXT NOT NULL,
    thumbnail     TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS versions_by_photo ON photo_versions (photo_id, created_at);
`;

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: postgres } = await import("postgres");
    // prepare:false works with Supabase's connection pooler (transaction mode).
    const sql = postgres(url, { prepare: false, max: 5, ssl: "require" });
    await sql.unsafe(SCHEMA);
    return {
      query: async <T,>(text: string, params: Params = []) =>
        (await sql.unsafe(text, params)) as unknown as T[],
    };
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL must be set when the app runs online.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(process.cwd(), "data", "pglite");
  mkdirSync(dir, { recursive: true });
  const lite = new PGlite(dir);
  await lite.exec(SCHEMA);
  return {
    query: async <T,>(text: string, params: Params = []) =>
      (await lite.query<T>(text, params)).rows,
  };
}

declare global {
  var __maisonDb: Promise<Driver> | undefined;
}

function driver(): Promise<Driver> {
  if (!globalThis.__maisonDb) {
    globalThis.__maisonDb = connect().catch((err) => {
      globalThis.__maisonDb = undefined; // try again on the next request
      throw err;
    });
  }
  return globalThis.__maisonDb;
}

async function query<T>(text: string, params?: Params): Promise<T[]> {
  return (await driver()).query<T>(text, params);
}

/* ---------------- Users ---------------- */

export type Plan = "visiteur" | "membre" | "atelier";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  plan: Plan;
};

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const rows = await query<UserRow>(
    "SELECT id, name, email, password_hash, plan FROM users WHERE lower(email) = lower($1)",
    [email],
  );
  return rows[0];
}

export async function findUserById(id: string): Promise<UserRow | undefined> {
  const rows = await query<UserRow>("SELECT id, name, email, password_hash, plan FROM users WHERE id = $1", [id]);
  return rows[0];
}

/** Returns false if the email is already registered. */
export async function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING RETURNING id`,
    [input.id, input.name, input.email, input.passwordHash],
  );
  return rows.length === 1;
}

/* ---------------- Rooms ---------------- */

export type RoomRow = {
  id: string;
  user_id: string;
  type: string;
  name: string;
  consultation: string; // JSON
  selections: string; // JSON
};

const ROOM_COLUMNS = "id, user_id, type, name, consultation, selections";

export async function listRooms(userId: string): Promise<RoomRow[]> {
  return query<RoomRow>(`SELECT ${ROOM_COLUMNS} FROM rooms WHERE user_id = $1 ORDER BY created_at, id`, [userId]);
}

export async function countRooms(userId: string): Promise<number> {
  const rows = await query<{ n: number | string }>("SELECT COUNT(*) AS n FROM rooms WHERE user_id = $1", [userId]);
  return Number(rows[0]?.n ?? 0);
}

/** Only ever returns a room that belongs to this user. */
export async function findRoom(userId: string, roomId: string): Promise<RoomRow | undefined> {
  const rows = await query<RoomRow>(`SELECT ${ROOM_COLUMNS} FROM rooms WHERE id = $1 AND user_id = $2`, [
    roomId,
    userId,
  ]);
  return rows[0];
}

/**
 * Adds a room only if the member is still under their room limit,
 * checked in the same statement so two quick clicks can't both succeed.
 */
export async function insertRoomWithinLimit(input: {
  id: string;
  userId: string;
  type: string;
  name: string;
  consultation: unknown;
  limit: number;
}): Promise<boolean> {
  const limit = Number.isFinite(input.limit) ? input.limit : 1_000_000;
  const rows = await query<{ id: string }>(
    `INSERT INTO rooms (id, user_id, type, name, consultation)
     SELECT $1, $2, $3, $4, $5
     WHERE (SELECT COUNT(*) FROM rooms WHERE user_id = $2) < $6
     RETURNING id`,
    [input.id, input.userId, input.type, input.name, JSON.stringify(input.consultation), limit],
  );
  return rows.length === 1;
}

export async function updateRoomSelections(userId: string, roomId: string, selections: unknown): Promise<void> {
  await query("UPDATE rooms SET selections = $1, updated_at = now() WHERE id = $2 AND user_id = $3", [
    JSON.stringify(selections),
    roomId,
    userId,
  ]);
}

export async function deleteRoom(userId: string, roomId: string): Promise<void> {
  await query("DELETE FROM rooms WHERE id = $1 AND user_id = $2", [roomId, userId]);
}

/* ---------------- Photos of the client's room ---------------- */

export type PhotoMeta = {
  id: string;
  room_id: string;
  mime: string;
  width: number;
  height: number;
  regions: string; // JSON
  locked: boolean;
};

const PHOTO_COLUMNS = "id, room_id, mime, width, height, regions, locked";

export async function listPhotos(userId: string, roomId: string): Promise<PhotoMeta[]> {
  return query<PhotoMeta>(
    `SELECT ${PHOTO_COLUMNS} FROM photos WHERE user_id = $1 AND room_id = $2 ORDER BY created_at, id`,
    [userId, roomId],
  );
}

export async function findPhoto(userId: string, photoId: string): Promise<PhotoMeta | undefined> {
  const rows = await query<PhotoMeta>(`SELECT ${PHOTO_COLUMNS} FROM photos WHERE id = $1 AND user_id = $2`, [
    photoId,
    userId,
  ]);
  return rows[0];
}

export async function photoData(userId: string, photoId: string): Promise<{ mime: string; data_b64: string } | undefined> {
  const rows = await query<{ mime: string; data_b64: string }>(
    "SELECT mime, data_b64 FROM photos WHERE id = $1 AND user_id = $2",
    [photoId, userId],
  );
  return rows[0];
}

/** Adds a photo to a room the user owns, if the room has fewer than `limit` photos. */
export async function insertPhotoWithinLimit(input: {
  id: string;
  userId: string;
  roomId: string;
  mime: string;
  dataB64: string;
  width: number;
  height: number;
  limit: number;
}): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO photos (id, user_id, room_id, mime, data_b64, width, height)
     SELECT $1, $2, $3, $4, $5, $6, $7
     WHERE EXISTS (SELECT 1 FROM rooms WHERE id = $3 AND user_id = $2)
       AND (SELECT COUNT(*) FROM photos WHERE room_id = $3) < $8
     RETURNING id`,
    [input.id, input.userId, input.roomId, input.mime, input.dataB64, input.width, input.height, input.limit],
  );
  return rows.length === 1;
}

export async function savePhotoRegions(userId: string, photoId: string, regions: unknown, locked: boolean): Promise<void> {
  await query("UPDATE photos SET regions = $1, locked = $2 WHERE id = $3 AND user_id = $4", [
    JSON.stringify(regions),
    locked,
    photoId,
    userId,
  ]);
}

export async function deletePhoto(userId: string, photoId: string): Promise<void> {
  await query("DELETE FROM photos WHERE id = $1 AND user_id = $2", [photoId, userId]);
}

export type VersionRow = { id: string; name: string; layers: string; thumbnail: string };

export async function listVersions(userId: string, photoId: string): Promise<VersionRow[]> {
  return query<VersionRow>(
    "SELECT id, name, layers, thumbnail FROM photo_versions WHERE photo_id = $1 AND user_id = $2 ORDER BY created_at, id",
    [photoId, userId],
  );
}

export async function insertVersion(input: {
  id: string;
  photoId: string;
  userId: string;
  name: string;
  layers: unknown;
  thumbnail: string;
}): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO photo_versions (id, photo_id, user_id, name, layers, thumbnail)
     SELECT $1, $2, $3, $4, $5, $6
     WHERE EXISTS (SELECT 1 FROM photos WHERE id = $2 AND user_id = $3)
     RETURNING id`,
    [input.id, input.photoId, input.userId, input.name, JSON.stringify(input.layers), input.thumbnail],
  );
  return rows.length === 1;
}

export async function deleteVersion(userId: string, versionId: string): Promise<void> {
  await query("DELETE FROM photo_versions WHERE id = $1 AND user_id = $2", [versionId, userId]);
}
