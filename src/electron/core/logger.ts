/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import fs from 'node:fs'
import path from 'node:path'
import { logsDir } from './paths'

type Level = 'debug' | 'info' | 'warn' | 'error'

const MAX_LOG_BYTES = 2 * 1024 * 1024

let stream: fs.WriteStream | null = null

function getStream(): fs.WriteStream | null {
  if (stream) return stream
  try {
    const file = path.join(logsDir(), 'main.log')
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_LOG_BYTES) {
      fs.renameSync(file, `${file}.1`)
    }
    stream = fs.createWriteStream(file, { flags: 'a' })
  } catch {
    stream = null
  }
  return stream
}

function write(level: Level, scope: string, message: string, extra?: unknown): void {
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] [${scope}] ${message}`
  const detail = extra === undefined ? '' : ` ${serialise(extra)}`

  if (level === 'error') console.error(line + detail)
  else if (level === 'warn') console.warn(line + detail)
  else console.log(line + detail)

  getStream()?.write(line + detail + '\n')
}

function serialise(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack ?? ''}`
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, extra?: unknown) => write('debug', scope, message, extra),
    info: (message: string, extra?: unknown) => write('info', scope, message, extra),
    warn: (message: string, extra?: unknown) => write('warn', scope, message, extra),
    error: (message: string, extra?: unknown) => write('error', scope, message, extra),
  }
}

export type Logger = ReturnType<typeof createLogger>

export const logger = createLogger('app')
