/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { z } from 'zod'
import { PAYMENT_MODES, type PaymentMode, type Receipt, type ReceiptInput } from '@/types/domain'
import { missingReferenceMessage, requiresReference } from '@/lib/schemas'
import { parseAmount } from '@/utils/currency'
import { applyDateKey, toDateKey } from '@/utils/date'

export const receiptItemFormSchema = z.object({
  sectionId: z.string().min(1, 'Choose a section.'),
  amount: z
    .string()
    .min(1, 'Enter an amount.')
    .refine((value) => Number.isFinite(parseAmount(value)), 'Enter a valid amount.')
    .refine((value) => parseAmount(value) > 0, 'Amount must be greater than 0.'),
  remarks: z.string().max(200, 'Remarks are too long.'),
})

export const receiptFormSchema = z
  .object({
    donorName: z.string().trim().min(1, 'Donor name is required.').max(120, 'Donor name is too long.'),
    donorAddress: z.string().max(300, 'Address is too long.'),
    donorPhone: z
      .string()
      .max(20)
      .refine((v) => v === '' || /^[0-9+\-() ]{6,20}$/.test(v), 'Enter a valid phone number.'),
    paymentMode: z.enum(PAYMENT_MODES),
    referenceNo: z.string().max(60, 'Reference is too long.'),
    notes: z.string().max(300, 'Note is too long.'),
    receiptDateKey: z.string().min(1, 'Choose a date.'),
    items: z.array(receiptItemFormSchema).min(1, 'Add at least one donation row.'),
  })
  .superRefine((value, ctx) => {
    if (requiresReference(value.paymentMode) && !value.referenceNo.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referenceNo'],
        message: missingReferenceMessage(value.paymentMode),
      })
    }
  })

export type ReceiptFormValues = z.infer<typeof receiptFormSchema>

export function emptyItem(): ReceiptFormValues['items'][number] {
  return { sectionId: '', amount: '', remarks: '' }
}

export function blankReceiptForm(defaultSectionId?: number): ReceiptFormValues {
  return {
    donorName: '',
    donorAddress: '',
    donorPhone: '',
    paymentMode: 'CASH' as PaymentMode,
    referenceNo: '',
    notes: '',
    receiptDateKey: toDateKey(),
    items: [{ ...emptyItem(), sectionId: defaultSectionId ? String(defaultSectionId) : '' }],
  }
}

export function receiptToForm(receipt: Receipt): ReceiptFormValues {
  return {
    donorName: receipt.donorName,
    donorAddress: receipt.donorAddress,
    donorPhone: receipt.donorPhone,
    paymentMode: receipt.paymentMode,
    referenceNo: receipt.referenceNo,
    notes: receipt.notes,
    receiptDateKey: receipt.receiptDateKey,
    items: receipt.items.map((item) => ({
      sectionId: String(item.sectionId),
      amount: String(item.amount),
      remarks: item.remarks,
    })),
  }
}

export function toReceiptInput(values: ReceiptFormValues, originalInstant?: string): ReceiptInput {
  return {
    donorName: values.donorName.trim(),
    donorAddress: values.donorAddress.trim(),
    donorPhone: values.donorPhone.trim(),
    paymentMode: values.paymentMode,
    referenceNo: values.referenceNo.trim(),
    notes: values.notes.trim(),
    receiptDate: applyDateKey(values.receiptDateKey, originalInstant),
    items: values.items.map((item) => ({
      sectionId: Number(item.sectionId),
      amount: parseAmount(item.amount),
      remarks: item.remarks.trim(),
    })),
  }
}

export function formTotal(items: ReceiptFormValues['items']): number {
  return items.reduce((sum, item) => {
    const amount = parseAmount(item.amount)
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0)
  }, 0)
}
