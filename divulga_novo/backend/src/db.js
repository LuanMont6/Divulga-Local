import fs from 'node:fs';
import path from 'node:path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function initDb(dbPath) {
  const abs = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const db = await open({ filename: abs, driver: sqlite3.Database });
  await db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT 'basico',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS menus (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      data_json   TEXT NOT NULL DEFAULT '{}',
      owner_id    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}
