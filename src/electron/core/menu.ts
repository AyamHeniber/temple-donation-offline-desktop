/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { app, dialog, Menu, shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'
import { IPC_EVENTS } from '@/types/ipc'
import { databasePath, logsDir, userDataDir } from './paths'

const isMac = process.platform === 'darwin'

function go(win: BrowserWindow, route: string): void {
  win.webContents.send(IPC_EVENTS.navigate, route)
}

export function buildApplicationMenu(win: BrowserWindow): Menu {
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ] satisfies MenuItemConstructorOptions[])
      : []),
    {
      label: '&File',
      submenu: [
        { label: 'New Receipt', accelerator: 'CmdOrCtrl+N', click: () => go(win, '/receipts/new') },
        { label: 'Receipts', accelerator: 'CmdOrCtrl+L', click: () => go(win, '/receipts') },
        { label: 'Reports', accelerator: 'CmdOrCtrl+R', click: () => go(win, '/reports') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => go(win, '/settings') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '&View',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+D', click: () => go(win, '/') },
        { label: 'Sections', accelerator: 'CmdOrCtrl+K', click: () => go(win, '/sections') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '&Tools',
      submenu: [
        { label: 'Backup & Restore', click: () => go(win, '/settings?tab=backup') },
        { type: 'separator' },
        { label: 'Open Data Folder', click: () => void shell.openPath(userDataDir()) },
        { label: 'Open Log Folder', click: () => void shell.openPath(logsDir()) },
        { label: 'Show Database File', click: () => shell.showItemInFolder(databasePath()) },
      ],
    },
    {
      label: '&Help',
      submenu: [
        {
          label: 'About DonationBox',
          click: () =>
            void dialog.showMessageBox(win, {
              type: 'info',
              title: 'About DonationBox',
              message: `DonationBox ${app.getVersion()}`,
              detail: [
                'Temple Donation Receipt Management',
                '',
                'Copyright \u00a9 2026 Ayam Heniber Meitei',
                'Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>',
                '',
                'Runs fully offline. All data is stored locally in:',
                databasePath(),
                '',
                `Electron ${process.versions.electron} \u00b7 Chromium ${process.versions.chrome}`,
              ].join('\n'),
              buttons: ['Close'],
            }),
        },
      ],
    },
  ]

  return Menu.buildFromTemplate(template)
}

export function installApplicationMenu(win: BrowserWindow): void {
  Menu.setApplicationMenu(buildApplicationMenu(win))
}
