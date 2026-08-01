/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useCallback, useState } from 'react'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'

type Busy = 'idle' | 'pdf' | 'print' | 'delete'

export function useReceiptActions(onChanged?: () => void) {
  const [busy, setBusy] = useState<Busy>('idle')
  const [busyId, setBusyId] = useState<number | null>(null)

  const start = (kind: Busy, id: number) => {
    setBusy(kind)
    setBusyId(id)
  }
  const stop = () => {
    setBusy('idle')
    setBusyId(null)
  }

  const downloadPdf = useCallback(async (receiptId: number) => {
    start('pdf', receiptId)
    try {
      const result = await api.documents.saveReceiptPdf(receiptId)
      if (result.saved) notify.success('Receipt saved', result.filePath)
    } catch (error) {
      notify.error(error, 'Could not create the PDF.')
    } finally {
      stop()
    }
  }, [])

  const print = useCallback(async (receiptId: number) => {
    start('print', receiptId)
    try {
      const result = await api.documents.printReceipt(receiptId)
      if (result.printed) notify.success('Sent to printer')
      else if (result.reason) notify.warning('Not printed', result.reason)
    } catch (error) {
      notify.error(error, 'Could not print the receipt.')
    } finally {
      stop()
    }
  }, [])

  const remove = useCallback(
    async (receiptId: number, receiptNumber: string) => {
      start('delete', receiptId)
      try {
        await api.receipts.remove(receiptId)
        notify.success('Receipt deleted', receiptNumber)
        onChanged?.()
      } catch (error) {
        notify.error(error, 'Could not delete the receipt.')
      } finally {
        stop()
      }
    },
    [onChanged],
  )

  return {
    downloadPdf,
    print,
    remove,
    busy,
    busyId,
    isBusy: (kind: Busy, id: number) => busy === kind && busyId === id,
  }
}
