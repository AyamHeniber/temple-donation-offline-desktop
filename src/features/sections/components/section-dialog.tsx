/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Section, SectionInput } from '@/types/domain'
import { sectionSchema } from '@/lib/schemas'
import { z } from 'zod'

const formSchema = z.object({
  name: sectionSchema.shape.name,
  description: z.string().max(200, 'Description is too long.'),
  isActive: z.boolean(),
  sortOrder: z
    .string()
    .refine((v) => v === '' || Number.isInteger(Number(v)), 'Enter a whole number.')
    .refine((v) => v === '' || (Number(v) >= 0 && Number(v) <= 9999), 'Use a value between 0 and 9999.'),
})

type FormValues = z.infer<typeof formSchema>

interface SectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section?: Section | null
  submitting: boolean
  onSubmit: (input: SectionInput) => Promise<void>
}

export function SectionDialog({ open, onOpenChange, section, submitting, onSubmit }: SectionDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', isActive: true, sortOrder: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      section
        ? {
            name: section.name,
            description: section.description,
            isActive: section.isActive,
            sortOrder: String(section.sortOrder),
          }
        : { name: '', description: '', isActive: true, sortOrder: '' },
    )
  }, [open, section, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      isActive: values.isActive,
      sortOrder: values.sortOrder === '' ? 0 : Number(values.sortOrder),
    })
  })

  const errors = form.formState.errors
  const isActive = form.watch('isActive')

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? 'Edit Section' : 'New Section'}</DialogTitle>
          <DialogDescription>
            Sections appear in the donation dropdown when creating a receipt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="section-name" required>
              Section Name
            </Label>
            <Input
              id="section-name"
              autoFocus
              placeholder="e.g. Annadanam"
              {...form.register('name')}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="field-error">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="section-description">Description</Label>
            <Textarea
              id="section-description"
              rows={2}
              placeholder="Shown only in this list — not printed on receipts."
              {...form.register('description')}
            />
            {errors.description ? <p className="field-error">{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="section-order">Display Order</Label>
              <Input
                id="section-order"
                inputMode="numeric"
                placeholder="0"
                {...form.register('sortOrder')}
                aria-invalid={Boolean(errors.sortOrder)}
              />
              {errors.sortOrder ? (
                <p className="field-error">{errors.sortOrder.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="section-active">Status</Label>
              <div className="flex h-10 items-center gap-3">
                <Switch
                  id="section-active"
                  checked={isActive}
                  onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
                />
                <span className="text-sm text-muted-foreground">
                  {isActive ? 'Active — shown in dropdowns' : 'Inactive — hidden from new receipts'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {section ? 'Save Changes' : 'Create Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
