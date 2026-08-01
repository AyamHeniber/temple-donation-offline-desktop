/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export const DB_FILE_NAME = 'donationbox.db'

function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function userDataDir(): string {
  return ensureDir(app.getPath('userData'))
}

export function databasePath(): string {
  return path.join(userDataDir(), DB_FILE_NAME)
}

export function databaseSidecarPaths(): string[] {
  const base = databasePath()
  return [`${base}-wal`, `${base}-shm`]
}

export function pendingRestorePath(): string {
  return path.join(userDataDir(), 'restore-pending.db')
}

export function assetsDir(): string {
  return ensureDir(path.join(userDataDir(), 'assets'))
}

export function defaultBackupsDir(): string {
  return ensureDir(path.join(userDataDir(), 'backups'))
}

export function fontsDir(): string {
  return ensureDir(path.join(userDataDir(), 'fonts'))
}

export function logsDir(): string {
  return ensureDir(path.join(userDataDir(), 'logs'))
}

export function tempDir(): string {
  return ensureDir(path.join(app.getPath('temp'), 'donationbox'))
}

export function resourcesDir(): string {
  return app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'resources')
}

export function rendererDist(): string {
  return path.join(app.getAppPath(), 'dist')
}

export function electronDist(): string {
  return path.join(app.getAppPath(), 'dist-electron')
}
