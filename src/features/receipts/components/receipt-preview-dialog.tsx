/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useState } from 'react'
import { Download, Pencil, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorState, LoadingPanel } from '@/components/common/states'
import { api } from '@/lib/api'
import { toMessage } from '@/utils/errors'
import { useReceiptActions } from '../use-receipt-actions'

interface ReceiptPreviewDialogProps {
  receiptId: number | null
  receiptNumber?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  allowEdit?: boolean
}

export function ReceiptPreviewDialog({
  receiptId,
  receiptNumber,
  open,
  onOpenChange,
  allowEdit = true,
}: ReceiptPreviewDialogProps) {
  const navigate = useNavigate()
  const actions = useReceiptActions()

  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || receiptId == null) return

    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { bytes } = await api.documents.receiptPdf(receiptId)
        if (cancelled) return

        const buffer = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer

        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
        setUrl(objectUrl)
      } catch (err) {
        if (!cancelled) setError(toMessage(err, 'Could not render this receipt.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      setUrl(null)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, receiptId])

  if (receiptId == null) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
          <DialogDescription>
            {receiptNumber ? `${receiptNumber} · ` : ''}A4 portrait — this is the exact document that
            prints and downloads.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
          {loading ? (
            <LoadingPanel label="Rendering receipt…" />
          ) : error ? (
            <ErrorState message={error} />
          ) : url ? (
            <iframe src={url} title="Receipt preview" className="h-full w-full" />
          ) : null}
        </div>

        <DialogFooter>
          {allowEdit ? (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                navigate(`/receipts/${receiptId}/edit`)
              }}
            >
              <Pencil aria-hidden />
              Edit
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => void actions.downloadPdf(receiptId)}
            loading={actions.isBusy('pdf', receiptId)}
          >
            <Download aria-hidden />
            Download PDF
          </Button>
          <Button
            onClick={() => void actions.print(receiptId)}
            loading={actions.isBusy('print', receiptId)}
          >
            <Printer aria-hidden />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
