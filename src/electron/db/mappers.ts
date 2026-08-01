/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type {
  BackupRecord,
  PaymentMode,
  Receipt,
  ReceiptItem,
  ReceiptSummary,
  Section,
  Settings,
} from '@/types/domain'
import { isPaymentMode } from '@/types/domain'
import { roundMoney } from '@/utils/currency'

type SettingsRow = {
  id: number
  templeName: string
  address: string
  phone: string
  email: string
  logo: string | null
  header: string
  footer: string
  receiptPrefix: string
  authorizedSignatory: string
  printerName: string
  printCopies: number
  printSilent: boolean
  backupFolder: string
  updatedAt: Date
}

type SectionRow = {
  id: number
  name: string
  description: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  _count?: { items: number }
}

type ReceiptItemRow = {
  id: number
  receiptId: number
  sectionId: number
  sectionName: string
  amount: number
  remarks: string
}

type ReceiptRow = {
  id: number
  receiptNumber: string
  financialYear: string
  sequence: number
  donorName: string
  donorAddress: string
  donorPhone: string
  paymentMode: string
  referenceNo: string
  totalAmount: number
  amountInWords: string
  receiptDate: Date
  receiptDateKey: string
  notes: string
  createdAt: Date
  updatedAt: Date
  items?: ReceiptItemRow[]
  _count?: { items: number }
}

type BackupRow = {
  id: number
  fileName: string
  filePath: string
  sizeBytes: number
  type: string
  note: string
  createdAt: Date
}

export function toPaymentMode(value: string): PaymentMode {
  return isPaymentMode(value) ? value : 'CASH'
}

export function mapSettings(row: SettingsRow, logoDataUrl: string | null): Settings {
  return {
    id: row.id,
    templeName: row.templeName,
    address: row.address,
    phone: row.phone,
    email: row.email,
    logo: row.logo,
    logoDataUrl,
    header: row.header,
    footer: row.footer,
    receiptPrefix: row.receiptPrefix,
    authorizedSignatory: row.authorizedSignatory,
    printerName: row.printerName,
    printCopies: row.printCopies,
    printSilent: row.printSilent,
    backupFolder: row.backupFolder,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapSection(row: SectionRow): Section {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row._count ? { usageCount: row._count.items } : {}),
  }
}

export function mapReceiptItem(row: ReceiptItemRow): ReceiptItem {
  return {
    id: row.id,
    receiptId: row.receiptId,
    sectionId: row.sectionId,
    sectionName: row.sectionName,
    amount: roundMoney(row.amount),
    remarks: row.remarks,
  }
}

export function mapReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    receiptNumber: row.receiptNumber,
    financialYear: row.financialYear,
    sequence: row.sequence,
    donorName: row.donorName,
    donorAddress: row.donorAddress,
    donorPhone: row.donorPhone,
    paymentMode: toPaymentMode(row.paymentMode),
    referenceNo: row.referenceNo,
    totalAmount: roundMoney(row.totalAmount),
    amountInWords: row.amountInWords,
    receiptDate: row.receiptDate.toISOString(),
    receiptDateKey: row.receiptDateKey,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: (row.items ?? []).map(mapReceiptItem),
  }
}

export function mapReceiptSummary(row: ReceiptRow): ReceiptSummary {
  return {
    id: row.id,
    receiptNumber: row.receiptNumber,
    donorName: row.donorName,
    donorAddress: row.donorAddress,
    paymentMode: toPaymentMode(row.paymentMode),
    totalAmount: roundMoney(row.totalAmount),
    receiptDate: row.receiptDate.toISOString(),
    receiptDateKey: row.receiptDateKey,
    itemCount: row._count?.items ?? row.items?.length ?? 0,
  }
}

export function mapBackup(row: BackupRow): BackupRecord {
  return {
    id: row.id,
    fileName: row.fileName,
    filePath: row.filePath,
    sizeBytes: row.sizeBytes,
    type: (['MANUAL', 'STARTUP', 'PRE_RESTORE', 'EXPORT'] as const).includes(
      row.type as BackupRecord['type'],
    )
      ? (row.type as BackupRecord['type'])
      : 'MANUAL',
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }
}
