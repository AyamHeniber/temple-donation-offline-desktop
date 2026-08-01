/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { BrowserWindow, session, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { createLogger } from './logger'
import { electronDist, rendererDist } from './paths'

const log = createLogger('window')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function preloadPath(): string {
  const dir = electronDist()
  const candidate = ['preload.mjs', 'preload.js', 'preload.cjs']
    .map((name) => path.join(dir, name))
    .find((file) => fs.existsSync(file))

  if (!candidate) log.error('Preload script not found in', dir)
  return candidate ?? path.join(dir, 'preload.mjs')
}

function contentSecurityPolicy(): string {
  const connect = DEV_SERVER_URL ? "connect-src 'self' ws: http://localhost:*" : "connect-src 'none'"
  const scripts = DEV_SERVER_URL ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'"

  return [
    "default-src 'self'",
    scripts,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "object-src 'self' blob:",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'self' blob:",
    connect,
  ].join('; ')
}

function shouldApplyCsp(url: string): boolean {
  return !/^(chrome-extension|devtools|chrome|blob|data):/i.test(url)
}

export function applySecurityPolicy(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!shouldApplyCsp(details.url)) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy()],
      },
    })
  })

  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1120,
    minHeight: 700,
    show: false,
    backgroundColor: '#faf7f2',
    title: 'DonationBox',
    autoHideMenuBar: false,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      webviewTag: false,
      plugins: true,
    },
  })

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const isDevServer = Boolean(DEV_SERVER_URL && url.startsWith(DEV_SERVER_URL))
    if (!isDevServer && !url.startsWith('file://')) event.preventDefault()
  })

  if (DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(path.join(rendererDist(), 'index.html'))
  }

  win.webContents.on('render-process-gone', (_event, details) => {
    log.error('Renderer process gone', details)
  })

  return win
}
