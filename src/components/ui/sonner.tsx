/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      richColors={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-lg border border-border bg-card text-card-foreground shadow-lg text-sm p-4 flex gap-3 items-start',
          title: 'font-semibold',
          description: 'text-muted-foreground text-[13px]',
          actionButton: 'bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-xs font-medium',
          cancelButton: 'bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-xs',
          error: 'border-destructive/40 [&_[data-title]]:text-destructive',
          success: 'border-success/40 [&_[data-title]]:text-success',
        },
      }}
    />
  )
}
