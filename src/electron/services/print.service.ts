/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { BrowserWindow, type WebContentsPrintOptions } from 'electron'
import path from 'node:path'
import type { PrinterInfo, Settings } from '@/types/domain'
import type { PrintResult } from '@/types/ipc'
import { AppError } from '@/utils/errors'
import { createLogger } from '../core/logger'
import { removeIfExists, writeFileBytes } from '../core/files'
import { tempDir } from '../core/paths'

const log = createLogger('print')

const RENDER_SETTLE_MS = 220
const LOAD_TIMEOUT_MS = 15_000

export interface PrintRequest {
  html: string
  jobName: string
  landscape?: boolean
  settings: Pick<Settings, 'printerName' | 'printCopies' | 'printSilent'>
}

export const printService = {
  async listPrinters(): Promise<PrinterInfo[]> {
    const host = BrowserWindow.getAllWindows()[0]
    if (!host) return []

    try {
      const printers = await host.webContents.getPrintersAsync()
      return printers.map((printer) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        isDefault: printer.isDefault,
        status: printer.status,
      }))
    } catch (error) {
      log.warn('Could not enumerate printers', error)
      return []
    }
  },

  async print(request: PrintRequest): Promise<PrintResult> {
    const file = path.join(tempDir(), `${request.jobName}-${Date.now()}.html`)
    writeFileBytes(file, request.html)

    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        javascript: false,
        sandbox: true,
      },
    })

    try {
      await loadWithTimeout(win, file)
      await delay(RENDER_SETTLE_MS)

      const options: WebContentsPrintOptions = {
        silent: request.settings.printSilent,
        printBackground: true,
        copies: Math.max(1, request.settings.printCopies || 1),
        landscape: Boolean(request.landscape),
        pageSize: 'A4',
        margins: { marginType: 'default' },
        ...(request.settings.printerName ? { deviceName: request.settings.printerName } : {}),
      }

      return await new Promise<PrintResult>((resolve) => {
        win.webContents.print(options, (success, failureReason) => {
          if (!success) log.warn(`Print job "${request.jobName}" not completed`, failureReason)
          resolve({ printed: success, reason: success ? undefined : failureReason })
        })
      })
    } catch (error) {
      log.error(`Print job "${request.jobName}" failed`, error)
      throw new AppError('PRINT', 'Could not send the document to the printer.', String(error))
    } finally {
      if (!win.isDestroyed()) win.destroy()
      removeIfExists(file)
    }
  },
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadWithTimeout(win: BrowserWindow, file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out preparing the print preview.')), LOAD_TIMEOUT_MS)

    win.webContents.once('did-finish-load', () => {
      clearTimeout(timer)
      resolve()
    })
    win.webContents.once('did-fail-load', (_event, _code, description) => {
      clearTimeout(timer)
      reject(new Error(description))
    })

    win.loadFile(file).catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}
