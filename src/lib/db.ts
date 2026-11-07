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
