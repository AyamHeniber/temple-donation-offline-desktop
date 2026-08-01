/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IPC_EVENTS, type DataDomain, type IpcResult, type TempleApi } from '@/types/ipc'

class IpcError extends Error {
  readonly code: string
  readonly details?: string

  constructor(code: string, message: string, details?: string) {
    super(message)
    this.name = 'IpcError'
    this.code = code
    this.details = details
  }
}

async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as IpcResult<T>

  if (!result || typeof result !== 'object' || !('ok' in result)) {
    throw new IpcError('UNKNOWN', 'The application returned an unexpected response.')
  }

  if (!result.ok) throw new IpcError(result.error.code, result.error.message, result.error.details)
  return result.data
}

function subscribe<T>(channel: string, handler: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => handler(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: TempleApi = {
  app: {
    info: () => call(IPC.app.info),
    openPath: (target) => call(IPC.app.openPath, target),
    relaunch: () => call(IPC.app.relaunch),
  },
  settings: {
    get: () => call(IPC.settings.get),
    update: (input) => call(IPC.settings.update, input),
    uploadLogo: () => call(IPC.settings.uploadLogo),
    clearLogo: () => call(IPC.settings.clearLogo),
    chooseBackupFolder: () => call(IPC.settings.chooseBackupFolder),
  },
  sections: {
    list: (includeInactive) => call(IPC.sections.list, includeInactive ?? false),
    create: (input) => call(IPC.sections.create, input),
    update: (id, input) => call(IPC.sections.update, id, input),
    remove: (id) => call(IPC.sections.remove, id),
  },
  receipts: {
    list: (query) => call(IPC.receipts.list, query),
    get: (id) => call(IPC.receipts.get, id),
    create: (input) => call(IPC.receipts.create, input),
    update: (id, input) => call(IPC.receipts.update, id, input),
    remove: (id) => call(IPC.receipts.remove, id),
    nextNumber: () => call(IPC.receipts.nextNumber),
  },
  dashboard: {
    stats: () => call(IPC.dashboard.stats),
  },
  reports: {
    donation: (query) => call(IPC.reports.donation, query),
  },
  documents: {
    receiptPdf: (receiptId) => call(IPC.documents.receiptPdf, receiptId),
    saveReceiptPdf: (receiptId) => call(IPC.documents.saveReceiptPdf, receiptId),
    printReceipt: (receiptId) => call(IPC.documents.printReceipt, receiptId),
    reportPdf: (query) => call(IPC.documents.reportPdf, query),
    saveReportPdf: (query) => call(IPC.documents.saveReportPdf, query),
    saveReportExcel: (query) => call(IPC.documents.saveReportExcel, query),
    saveReportCsv: (query) => call(IPC.documents.saveReportCsv, query),
    printReport: (query) => call(IPC.documents.printReport, query),
    printers: () => call(IPC.documents.printers),
  },
  backup: {
    list: () => call(IPC.backup.list),
    create: (note) => call(IPC.backup.create, note ?? ''),
    restore: (filePath) => call(IPC.backup.restore, filePath),
    exportTo: (id) => call(IPC.backup.exportTo, id),
    importFrom: () => call(IPC.backup.importFrom),
    remove: (id) => call(IPC.backup.remove, id),
    revealFolder: () => call(IPC.backup.revealFolder),
  },
  events: {
    onNavigate: (handler) => subscribe<string>(IPC_EVENTS.navigate, handler),
    onDataChanged: (handler) => subscribe<DataDomain>(IPC_EVENTS.dataChanged, handler),
  },
}

contextBridge.exposeInMainWorld('api', api)
