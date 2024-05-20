import { resolve } from 'node:path'
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

const Source = resolve(__dirname, '../db.sqlite')

export let db: Database<sqlite3.Database, sqlite3.Statement>

export async function init() {
  db = await open({
    filename: Source,
    driver: sqlite3.Database
  })

  await db.get('PRAGMA foreign_keys = ON;')

  await db.exec(/*sql*/`
    CREATE TABLE IF NOT EXISTS heartbeat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bpm INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `)
}

export async function setHeartbeat(bpm: number, timestamp: number) {
  await db.run(/*sql*/`
    INSERT INTO heartbeat (bpm, timestamp)
    VALUES (?, ?)
  `, bpm, timestamp)
}

export interface Heartbeat {
  id: number
  bpm: number
  timestamp: number
}

export async function getLatestHeartbeat(): Promise<Heartbeat | undefined> {
  return await db.get(/*sql*/`
    SELECT * FROM heartbeat
    ORDER BY timestamp DESC
    LIMIT 1
  `)
}

export function getLastXHeartbeats(x: number): Promise<Heartbeat[]> {
  return db.all(/*sql*/`
    SELECT * FROM heartbeat
    ORDER BY timestamp DESC
    LIMIT ?
  `, x)
}
