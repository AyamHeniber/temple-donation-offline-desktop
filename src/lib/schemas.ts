/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { z } from 'zod'
import { PAYMENT_MODES, type PaymentMode } from '@/types/domain'
import { DATE_KEY_FORMAT } from '@/utils/date'
import dayjs from 'dayjs'

const trimmed = (max: number) => z.string().trim().max(max)

export const paymentModeSchema = z.enum(PAYMENT_MODES, {
  errorMap: () => ({ message: 'Select a valid payment mode.' }),
})

export const dateKeySchema = z
  .string()
  .refine((value) => dayjs(value, DATE_KEY_FORMAT, true).isValid(), 'Enter a valid date.')

export const receiptItemSchema = z.object({
  sectionId: z.coerce
    .number({ invalid_type_error: 'Choose a section.' })
    .int()
    .positive('Choose a section.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount.' })
    .positive('Amount must be greater than 0.')
    .max(99_99_99_999, 'Amount is too large.'),
  remarks: trimmed(200).default(''),
})

export const receiptSchema = z.object({
  donorName: z.string().trim().min(1, 'Donor name is required.').max(120, 'Donor name is too long.'),
  donorAddress: trimmed(300).default(''),
  donorPhone: trimmed(20)
    .default('')
    .refine((v) => v === '' || /^[0-9+\-() ]{6,20}$/.test(v), 'Enter a valid phone number.'),
  paymentMode: paymentModeSchema,
  referenceNo: trimmed(60).default(''),
  notes: trimmed(300).default(''),
  receiptDate: z.string().optional(),
  items: z
    .array(receiptItemSchema)
    .min(1, 'Add at least one donation row.')
    .max(50, 'A receipt cannot hold more than 50 rows.'),
})

export type ReceiptFormValues = z.input<typeof receiptSchema>

export function requiresReference(mode: PaymentMode): boolean {
  return mode === 'CHEQUE' || mode === 'NEFT'
}

export function referenceLabel(mode: PaymentMode): string {
  switch (mode) {
    case 'CHEQUE':
      return 'Cheque Number'
    case 'NEFT':
      return 'NEFT / UTR Reference'
    case 'UPI':
      return 'UPI Reference'
    default:
      return 'Reference'
  }
}

export function missingReferenceMessage(mode: PaymentMode): string {
  return `${referenceLabel(mode)} is required.`
}

export const receiptSchemaWithReference = receiptSchema.superRefine((value, ctx) => {
  if (requiresReference(value.paymentMode) && !value.referenceNo?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['referenceNo'],
      message: missingReferenceMessage(value.paymentMode),
    })
  }
})

export const sectionSchema = z.object({
  name: z.string().trim().min(2, 'Section name is required.').max(80, 'Section name is too long.'),
  description: trimmed(200).default(''),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
})

export const settingsSchema = z.object({
  templeName: z.string().trim().min(2, 'Temple name is required.').max(120),
  address: trimmed(300).default(''),
  phone: trimmed(40).default(''),
  email: trimmed(120)
    .default('')
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email.'),
  header: trimmed(200).default(''),
  footer: trimmed(300).default(''),
  receiptPrefix: z
    .string()
    .trim()
    .min(2, 'Prefix must be at least 2 characters.')
    .max(10, 'Prefix must be 10 characters or fewer.')
    .regex(/^[A-Za-z0-9]+$/, 'Use letters and numbers only.'),
  authorizedSignatory: trimmed(80).default(''),
  printerName: trimmed(160).default(''),
  printCopies: z.coerce.number().int().min(1, 'At least one copy.').max(9, 'Maximum 9 copies.'),
  printSilent: z.boolean().default(false),
  backupFolder: trimmed(400).default(''),
})

export const reportQuerySchema = z
  .object({
    fromDate: dateKeySchema,
    toDate: dateKeySchema,
    paymentMode: paymentModeSchema.nullable().optional(),
    sectionId: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((v) => v.fromDate <= v.toDate, {
    path: ['toDate'],
    message: '"To" date must be on or after the "From" date.',
  })

export const receiptListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  fromDate: dateKeySchema.nullable().optional(),
  toDate: dateKeySchema.nullable().optional(),
  paymentMode: paymentModeSchema.nullable().optional(),
  sectionId: z.coerce.number().int().positive().nullable().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(200).default(10),
  sortBy: z.enum(['receiptNumber', 'receiptDate', 'donorName', 'totalAmount']).default('receiptDate'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})
