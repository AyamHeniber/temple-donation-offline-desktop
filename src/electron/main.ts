/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { app, BrowserWindow, dialog } from 'electron'
import { createLogger } from './core/logger'
import { installApplicationMenu } from './core/menu'
import { applySecurityPolicy, createMainWindow } from './core/window'
import { bootstrapDatabase } from './db/bootstrap'
import { disconnectPrisma } from './db/client'
import { applyPendingRestore } from './db/restore'
import { registerIpcHandlers } from './ipc'

const log = createLogger('main')

let mainWindow: BrowserWindow | null = null

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  void start()
}

async function start(): Promise<void> {
  app.setAppUserModelId('org.temple.donationbox')

  app.commandLine.appendSwitch('disable-http-cache')

  await app.whenReady()

  try {
    if (applyPendingRestore()) log.info('Applied a staged database restore')
    await bootstrapDatabase()
  } catch (error) {
    log.error('Database bootstrap failed', error)
    dialog.showErrorBox(
      'DonationBox could not start',
      'The local database could not be opened.\n\n' +
        'If you recently restored a backup, restore it again from a known-good file.\n\n' +
        String(error),
    )
    app.exit(1)
    return
  }

  applySecurityPolicy()
  registerIpcHandlers()

  mainWindow = createMainWindow()
  installApplicationMenu(mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
      installApplicationMenu(mainWindow)
    }
  })

  log.info(`DonationBox ${app.getVersion()} started`)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  void disconnectPrisma()
})

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', error)
  if (app.isReady()) {
    dialog.showErrorBox('Unexpected error', String(error?.message ?? error))
  }
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', reason)
})
