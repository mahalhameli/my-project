import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * A small local SQLite database (built into Node.js) so the app works
 * out of the box. It can be swapped for PostgreSQL / Supabase later.
 */
const DATA_DIR = path.join(process.cwd(), "data");

declare global {
  var __maisonDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "maison.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT 'visiteur',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type          TEXT NOT NULL,
      name          TEXT NOT NULL,
      consultation  TEXT NOT NULL,
      selections    TEXT NOT NULL DEFAULT '{}',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS rooms_by_user ON rooms(user_id, created_at);
  `);
  return db;
}

export const db: DatabaseSync = globalThis.__maisonDb ?? open();
if (process.env.NODE_ENV !== "production") globalThis.__maisonDb = db;

export type Plan = "visiteur" | "membre" | "atelier";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  plan: Plan;
  created_at: string;
};

export function findUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}): void {
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
  ).run(input.id, input.name, input.email, input.passwordHash);
}

/* ---------------- Rooms ---------------- */

export type RoomRow = {
  id: string;
  user_id: string;
  type: string;
  name: string;
  consultation: string; // JSON
  selections: string; // JSON
  created_at: string;
  updated_at: string;
};

export function listRooms(userId: string): RoomRow[] {
  return db
    .prepare("SELECT * FROM rooms WHERE user_id = ? ORDER BY created_at, rowid")
    .all(userId) as RoomRow[];
}

export function countRooms(userId: string): number {
  const row = db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE user_id = ?").get(userId) as { n: number };
  return Number(row.n);
}

/** Only ever returns a room that belongs to this user. */
export function findRoom(userId: string, roomId: string): RoomRow | undefined {
  return db
    .prepare("SELECT * FROM rooms WHERE id = ? AND user_id = ?")
    .get(roomId, userId) as RoomRow | undefined;
}

export function insertRoom(input: {
  id: string;
  userId: string;
  type: string;
  name: string;
  consultation: unknown;
}): void {
  db.prepare(
    "INSERT INTO rooms (id, user_id, type, name, consultation) VALUES (?, ?, ?, ?, ?)",
  ).run(input.id, input.userId, input.type, input.name, JSON.stringify(input.consultation));
}

export function updateRoomSelections(userId: string, roomId: string, selections: unknown): void {
  db.prepare(
    "UPDATE rooms SET selections = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
  ).run(JSON.stringify(selections), roomId, userId);
}

export function deleteRoom(userId: string, roomId: string): void {
  db.prepare("DELETE FROM rooms WHERE id = ? AND user_id = ?").run(roomId, userId);
}
