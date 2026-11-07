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
