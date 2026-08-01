/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type {
  AppInfo,
  BackupRecord,
  DashboardStats,
  DonationReport,
  Paginated,
  PrinterInfo,
  Receipt,
  ReceiptInput,
  ReceiptListQuery,
  ReceiptSummary,
  ReportQuery,
  Section,
  SectionInput,
  Settings,
  SettingsInput,
} from './domain'

export const IPC = {
  app: {
    info: 'app:info',
    openPath: 'app:open-path',
    relaunch: 'app:relaunch',
  },
  settings: {
    get: 'settings:get',
    update: 'settings:update',
    uploadLogo: 'settings:upload-logo',
    clearLogo: 'settings:clear-logo',
    chooseBackupFolder: 'settings:choose-backup-folder',
  },
  sections: {
    list: 'sections:list',
    create: 'sections:create',
    update: 'sections:update',
    remove: 'sections:remove',
  },
  receipts: {
    list: 'receipts:list',
    get: 'receipts:get',
    create: 'receipts:create',
    update: 'receipts:update',
    remove: 'receipts:remove',
    nextNumber: 'receipts:next-number',
  },
  dashboard: {
    stats: 'dashboard:stats',
  },
  reports: {
    donation: 'reports:donation',
  },
  documents: {
    receiptPdf: 'documents:receipt-pdf',
    saveReceiptPdf: 'documents:save-receipt-pdf',
    printReceipt: 'documents:print-receipt',
    reportPdf: 'documents:report-pdf',
    saveReportPdf: 'documents:save-report-pdf',
    saveReportExcel: 'documents:save-report-excel',
    saveReportCsv: 'documents:save-report-csv',
    printReport: 'documents:print-report',
    printers: 'documents:printers',
  },
  backup: {
    list: 'backup:list',
    create: 'backup:create',
    restore: 'backup:restore',
    exportTo: 'backup:export',
    importFrom: 'backup:import',
    remove: 'backup:remove',
    revealFolder: 'backup:reveal-folder',
  },
} as const

export const IPC_EVENTS = {
  navigate: 'event:navigate',
  dataChanged: 'event:data-changed',
} as const

export type DataDomain = 'receipts' | 'sections' | 'settings' | 'backups'

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcErrorPayload }

export interface IpcErrorPayload {
  code: string
  message: string
  details?: string
}

export interface SaveFileResult {
  saved: boolean
  filePath?: string
}

export interface PrintResult {
  printed: boolean
  reason?: string
}

export interface PdfPayload {
  bytes: Uint8Array
  fileName: string
}

export interface RestoreResult {
  restored: boolean
  requiresRestart: boolean
  safetyBackupPath?: string
}

export interface TempleApi {
  app: {
    info(): Promise<AppInfo>
    openPath(target: string): Promise<void>
    relaunch(): Promise<void>
  }
  settings: {
    get(): Promise<Settings>
    update(input: SettingsInput): Promise<Settings>
    uploadLogo(): Promise<Settings>
    clearLogo(): Promise<Settings>
    chooseBackupFolder(): Promise<string | null>
  }
  sections: {
    list(includeInactive?: boolean): Promise<Section[]>
    create(input: SectionInput): Promise<Section>
    update(id: number, input: SectionInput): Promise<Section>
    remove(id: number): Promise<void>
  }
  receipts: {
    list(query: ReceiptListQuery): Promise<Paginated<ReceiptSummary>>
    get(id: number): Promise<Receipt>
    create(input: ReceiptInput): Promise<Receipt>
    update(id: number, input: ReceiptInput): Promise<Receipt>
    remove(id: number): Promise<void>
    nextNumber(): Promise<string>
  }
  dashboard: {
    stats(): Promise<DashboardStats>
  }
  reports: {
    donation(query: ReportQuery): Promise<DonationReport>
  }
  documents: {
    receiptPdf(receiptId: number): Promise<PdfPayload>
    saveReceiptPdf(receiptId: number): Promise<SaveFileResult>
    printReceipt(receiptId: number): Promise<PrintResult>
    reportPdf(query: ReportQuery): Promise<PdfPayload>
    saveReportPdf(query: ReportQuery): Promise<SaveFileResult>
    saveReportExcel(query: ReportQuery): Promise<SaveFileResult>
    saveReportCsv(query: ReportQuery): Promise<SaveFileResult>
    printReport(query: ReportQuery): Promise<PrintResult>
    printers(): Promise<PrinterInfo[]>
  }
  backup: {
    list(): Promise<BackupRecord[]>
    create(note?: string): Promise<BackupRecord>
    restore(filePath: string): Promise<RestoreResult>
    exportTo(id: number): Promise<SaveFileResult>
    importFrom(): Promise<RestoreResult>
    remove(id: number): Promise<void>
    revealFolder(): Promise<void>
  }
  events: {
    onNavigate(handler: (route: string) => void): () => void
    onDataChanged(handler: (domain: DataDomain) => void): () => void
  }
}
