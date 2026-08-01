/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { BrowserWindow, ipcMain } from 'electron'
import { ZodError } from 'zod'
import type { DataDomain, IpcErrorPayload, IpcResult } from '@/types/ipc'
import { IPC_EVENTS } from '@/types/ipc'
import { AppError } from '@/utils/errors'
import { createLogger } from '../core/logger'

const log = createLogger('ipc')

const PRISMA_MESSAGES: Record<string, string> = {
  P2002: 'A record with these details already exists.',
  P2003: 'This record is referenced elsewhere and cannot be changed.',
  P2025: 'That record no longer exists.',
}

function firstZodMessage(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'The information provided is not valid.'
  return issue.message
}

export function toErrorPayload(error: unknown): IpcErrorPayload {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, details: error.details }
  }

  if (error instanceof ZodError) {
    return { code: 'VALIDATION', message: firstZodMessage(error), details: error.message }
  }

  const code = (error as { code?: string })?.code
  if (code && PRISMA_MESSAGES[code]) {
    return { code: 'DB', message: PRISMA_MESSAGES[code], details: String(error) }
  }

  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    details: error instanceof Error ? error.stack : String(error),
  }
}

export function handle<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (...args: TArgs) => Promise<TResult> | TResult,
): void {
  ipcMain.handle(channel, async (_event, ...args): Promise<IpcResult<TResult>> => {
    try {
      return { ok: true, data: await handler(...(args as TArgs)) }
    } catch (error) {
      const payload = toErrorPayload(error)
      if (payload.code === 'CANCELLED') log.debug(`${channel} cancelled`)
      else log.error(`${channel} failed: ${payload.message}`, payload.details)

      return { ok: false, error: payload }
    }
  })
}

export function broadcast(domain: DataDomain): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(IPC_EVENTS.dataChanged, domain)
  }
}
