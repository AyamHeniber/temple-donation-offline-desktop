/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, LoadingPanel } from '@/components/common/states'
import { ReceiptForm } from '@/features/receipts/components/receipt-form'
import type { ReceiptInput } from '@/types/domain'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { useAsync } from '@/hooks/use-async'
import { formatDateTime } from '@/utils/date'

export function ReceiptEditPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const receiptId = Number(params.id)

  const [submitting, setSubmitting] = useState(false)
  const receipt = useAsync(() => api.receipts.get(receiptId), [receiptId])

  const handleSubmit = async (input: ReceiptInput) => {
    setSubmitting(true)
    try {
      const updated = await api.receipts.update(receiptId, input)
      notify.success('Receipt updated', updated.receiptNumber)
      navigate('/receipts')
    } catch (error) {
      notify.error(error, 'Could not update the receipt.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!Number.isFinite(receiptId)) {
    return <ErrorState message="That receipt link is not valid." onRetry={() => navigate('/receipts')} />
  }

  if (receipt.initialising) return <LoadingPanel label="Loading receipt…" />

  if (receipt.error || !receipt.data) {
    return (
      <ErrorState
        message={receipt.error ?? 'That receipt could not be found.'}
        onRetry={() => void receipt.refresh()}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={`Edit ${receipt.data.receiptNumber}`}
        description="Corrections keep the original receipt number and financial year."
        actions={<Badge variant="outline">Issued {formatDateTime(receipt.data.receiptDate)}</Badge>}
      />

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            The receipt number <strong className="text-foreground">{receipt.data.receiptNumber}</strong> is
            already with the donor and will not change. If the date is edited, the original time of issue is
            preserved.
          </p>
        </CardContent>
      </Card>

      <ReceiptForm
        receipt={receipt.data}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/receipts')}
      />
    </>
  )
}
