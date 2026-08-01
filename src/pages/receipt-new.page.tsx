/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReceiptForm } from '@/features/receipts/components/receipt-form'
import { ReceiptPreviewDialog } from '@/features/receipts/components/receipt-preview-dialog'
import type { Receipt, ReceiptInput } from '@/types/domain'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { useAsync } from '@/hooks/use-async'
import { useAppStore } from '@/store/app-store'

export function ReceiptNewPage() {
  const navigate = useNavigate()
  const sections = useAppStore((state) => state.sections)

  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Receipt | null>(null)

  const nextNumber = useAsync(() => api.receipts.nextNumber(), [])

  const handleSubmit = async (input: ReceiptInput) => {
    setSubmitting(true)
    try {
      const receipt = await api.receipts.create(input)
      notify.success('Receipt saved', receipt.receiptNumber)
      setCreated(receipt)
      void nextNumber.refresh()
    } catch (error) {
      notify.error(error, 'Could not save the receipt.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="New Donation Receipt"
        description="The receipt number and timestamp are generated automatically."
      />

      {sections.length === 0 ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-medium">No active donation sections</p>
              <p className="text-sm text-muted-foreground">
                Add at least one section before creating a receipt.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/sections')}>
              Manage sections
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ReceiptForm
        nextNumber={nextNumber.data ?? undefined}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/receipts')}
      />

      <ReceiptPreviewDialog
        receiptId={created?.id ?? null}
        receiptNumber={created?.receiptNumber}
        open={created !== null}
        allowEdit={false}
        onOpenChange={(open) => {
          if (open) return
          setCreated(null)
          navigate('/receipts')
        }}
      />
    </>
  )
}
