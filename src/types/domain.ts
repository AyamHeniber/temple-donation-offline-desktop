/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

export const PAYMENT_MODES = ['CASH', 'UPI', 'NEFT', 'CHEQUE'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  NEFT: 'NEFT',
  CHEQUE: 'Cheque',
}

export const DEFAULT_PAYMENT_MODE: PaymentMode = 'CASH'

export function isPaymentMode(value: unknown): value is PaymentMode {
  return typeof value === 'string' && (PAYMENT_MODES as readonly string[]).includes(value)
}

export interface Settings {
  id: number
  templeName: string
  address: string
  phone: string
  email: string
  logo: string | null
  logoDataUrl: string | null
  header: string
  footer: string
  receiptPrefix: string
  authorizedSignatory: string
  printerName: string
  printCopies: number
  printSilent: boolean
  backupFolder: string
  updatedAt: string
}

export interface Section {
  id: number
  name: string
  description: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  usageCount?: number
}

export interface ReceiptItem {
  id: number
  receiptId: number
  sectionId: number
  sectionName: string
  amount: number
  remarks: string
}

export interface Receipt {
  id: number
  receiptNumber: string
  financialYear: string
  sequence: number
  donorName: string
  donorAddress: string
  donorPhone: string
  paymentMode: PaymentMode
  referenceNo: string
  totalAmount: number
  amountInWords: string
  receiptDate: string
  receiptDateKey: string
  notes: string
  createdAt: string
  updatedAt: string
  items: ReceiptItem[]
}

export interface ReceiptSummary {
  id: number
  receiptNumber: string
  donorName: string
  donorAddress: string
  paymentMode: PaymentMode
  totalAmount: number
  receiptDate: string
  receiptDateKey: string
  itemCount: number
}

export interface BackupRecord {
  id: number
  fileName: string
  filePath: string
  sizeBytes: number
  type: 'MANUAL' | 'STARTUP' | 'PRE_RESTORE' | 'EXPORT'
  note: string
  createdAt: string
}

export type ReceiptSortField = 'receiptNumber' | 'receiptDate' | 'donorName' | 'totalAmount'
export type SortDirection = 'asc' | 'desc'

export interface ReceiptListQuery {
  search?: string
  fromDate?: string | null
  toDate?: string | null
  paymentMode?: PaymentMode | null
  sectionId?: number | null
  page: number
  pageSize: number
  sortBy: ReceiptSortField
  sortDir: SortDirection
}

export interface Paginated<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ReceiptItemInput {
  sectionId: number
  amount: number
  remarks: string
}

export interface ReceiptInput {
  donorName: string
  donorAddress: string
  donorPhone: string
  paymentMode: PaymentMode
  referenceNo: string
  notes: string
  receiptDate?: string
  items: ReceiptItemInput[]
}

export interface SectionInput {
  name: string
  description: string
  isActive: boolean
  sortOrder: number
}

export type SettingsInput = Omit<Settings, 'id' | 'updatedAt' | 'logo' | 'logoDataUrl'>

export interface DashboardStats {
  todayTotal: number
  todayCount: number
  monthTotal: number
  monthCount: number
  financialYearTotal: number
  totalReceipts: number
  totalCollected: number
  financialYear: string
  nextReceiptNumber: string
  recentReceipts: ReceiptSummary[]
  paymentModeBreakdown: Array<{ mode: PaymentMode; total: number; count: number }>
  topSections: Array<{ sectionId: number; sectionName: string; total: number }>
  dailyTrend: Array<{ dateKey: string; total: number }>
}

export interface ReportRow {
  id: number
  receiptNumber: string
  receiptDate: string
  donorName: string
  donorAddress: string
  paymentMode: PaymentMode
  cash: number
  upi: number
  neft: number
  cheque: number
  total: number
  sections: string
}

export interface ReportTotals {
  cash: number
  upi: number
  neft: number
  cheque: number
  overall: number
  receiptCount: number
}

export interface ReportSectionTotal {
  sectionId: number
  sectionName: string
  total: number
  count: number
}

export interface DonationReport {
  fromDate: string
  toDate: string
  generatedAt: string
  rows: ReportRow[]
  totals: ReportTotals
  sectionTotals: ReportSectionTotal[]
}

export interface ReportQuery {
  fromDate: string
  toDate: string
  paymentMode?: PaymentMode | null
  sectionId?: number | null
}

export interface PrinterInfo {
  name: string
  displayName: string
  isDefault: boolean
  status: number
}

export interface AppInfo {
  version: string
  electron: string
  platform: NodeJS.Platform
  databasePath: string
  userDataPath: string
  backupFolder: string
  isPackaged: boolean
}
