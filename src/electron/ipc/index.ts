/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { app, shell } from 'electron'
import type {
  AppInfo,
  ReceiptInput,
  ReceiptListQuery,
  ReportQuery,
  SectionInput,
  SettingsInput,
} from '@/types/domain'
import { IPC } from '@/types/ipc'
import { AppError } from '@/utils/errors'
import { databasePath, userDataDir, defaultBackupsDir } from '../core/paths'
import { backupService } from '../services/backup.service'
import { dashboardService } from '../services/dashboard.service'
import { documentService } from '../services/document.service'
import { receiptService } from '../services/receipt.service'
import { reportService } from '../services/report.service'
import { sectionService } from '../services/section.service'
import { settingsService } from '../services/settings.service'
import { broadcast, handle } from './handle'

export function registerIpcHandlers(): void {
  registerApp()
  registerSettings()
  registerSections()
  registerReceipts()
  registerDashboard()
  registerReports()
  registerDocuments()
  registerBackup()
}

function registerApp(): void {
  handle(IPC.app.info, async (): Promise<AppInfo> => {
    const settings = await settingsService.get()
    return {
      version: app.getVersion(),
      electron: process.versions.electron,
      platform: process.platform,
      databasePath: databasePath(),
      userDataPath: userDataDir(),
      backupFolder: settings.backupFolder || defaultBackupsDir(),
      isPackaged: app.isPackaged,
    }
  })

  handle(IPC.app.openPath, async (target: string) => {
    if (!target || /^[a-z]+:\/\//i.test(target)) {
      throw AppError.validation('Only local folders can be opened from the app.')
    }
    await shell.openPath(target)
  })

  handle(IPC.app.relaunch, () => {
    backupService.relaunch()
  })
}

function registerSettings(): void {
  handle(IPC.settings.get, () => settingsService.get())

  handle(IPC.settings.update, async (input: SettingsInput) => {
    const settings = await settingsService.update(input)
    broadcast('settings')
    return settings
  })

  handle(IPC.settings.uploadLogo, async () => {
    const settings = await settingsService.uploadLogo()
    broadcast('settings')
    return settings
  })

  handle(IPC.settings.clearLogo, async () => {
    const settings = await settingsService.clearLogo()
    broadcast('settings')
    return settings
  })

  handle(IPC.settings.chooseBackupFolder, async () => {
    const folder = await settingsService.chooseBackupFolder()
    if (folder) broadcast('settings')
    return folder
  })
}

function registerSections(): void {
  handle(IPC.sections.list, (includeInactive?: boolean) => sectionService.list(includeInactive ?? false))

  handle(IPC.sections.create, async (input: SectionInput) => {
    const section = await sectionService.create(input)
    broadcast('sections')
    return section
  })

  handle(IPC.sections.update, async (id: number, input: SectionInput) => {
    const section = await sectionService.update(id, input)
    broadcast('sections')
    return section
  })

  handle(IPC.sections.remove, async (id: number) => {
    await sectionService.remove(id)
    broadcast('sections')
  })
}

function registerReceipts(): void {
  handle(IPC.receipts.list, (query: ReceiptListQuery) => receiptService.list(query))
  handle(IPC.receipts.get, (id: number) => receiptService.get(id))
  handle(IPC.receipts.nextNumber, () => receiptService.nextNumber())

  handle(IPC.receipts.create, async (input: ReceiptInput) => {
    const receipt = await receiptService.create(input)
    broadcast('receipts')
    return receipt
  })

  handle(IPC.receipts.update, async (id: number, input: ReceiptInput) => {
    const receipt = await receiptService.update(id, input)
    broadcast('receipts')
    return receipt
  })

  handle(IPC.receipts.remove, async (id: number) => {
    await receiptService.remove(id)
    broadcast('receipts')
  })
}

function registerDashboard(): void {
  handle(IPC.dashboard.stats, () => dashboardService.stats())
}

function registerReports(): void {
  handle(IPC.reports.donation, (query: ReportQuery) => reportService.donation(query))
}

function registerDocuments(): void {
  handle(IPC.documents.receiptPdf, (receiptId: number) => documentService.receiptPdf(receiptId))
  handle(IPC.documents.saveReceiptPdf, (receiptId: number) => documentService.saveReceiptPdf(receiptId))
  handle(IPC.documents.printReceipt, (receiptId: number) => documentService.printReceipt(receiptId))

  handle(IPC.documents.reportPdf, (query: ReportQuery) => documentService.reportPdf(query))
  handle(IPC.documents.saveReportPdf, (query: ReportQuery) => documentService.saveReportPdf(query))
  handle(IPC.documents.saveReportExcel, (query: ReportQuery) => documentService.saveReportExcel(query))
  handle(IPC.documents.saveReportCsv, (query: ReportQuery) => documentService.saveReportCsv(query))
  handle(IPC.documents.printReport, (query: ReportQuery) => documentService.printReport(query))
  handle(IPC.documents.printers, () => documentService.printers())
}

function registerBackup(): void {
  handle(IPC.backup.list, () => backupService.list())

  handle(IPC.backup.create, async (note?: string) => {
    const record = await backupService.create(note ?? '')
    broadcast('backups')
    return record
  })

  handle(IPC.backup.restore, (filePath: string) => backupService.restore(filePath))
  handle(IPC.backup.importFrom, () => backupService.importFrom())

  handle(IPC.backup.exportTo, (id: number) => backupService.exportTo(id))

  handle(IPC.backup.remove, async (id: number) => {
    await backupService.remove(id)
    broadcast('backups')
  })

  handle(IPC.backup.revealFolder, () => backupService.revealFolder())
}
