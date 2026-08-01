/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FolderOpen, ImagePlus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PrinterInfo, Settings, SettingsInput } from '@/types/domain'
import { settingsSchema } from '@/lib/schemas'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { normalisePrefix, previewReceiptNumber } from '@/utils/receipt-number'

const SYSTEM_PRINTER = '__system__'

const formSchema = settingsSchema.extend({
  printCopies: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 9, 'Enter 1 to 9 copies.'),
})

type FormValues = z.input<typeof formSchema>

interface SettingsFormProps {
  settings: Settings
  onSaved: (settings: Settings) => void
}

export function SettingsForm({ settings, onSaved }: SettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [printers, setPrinters] = useState<PrinterInfo[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(settings),
  })

  useEffect(() => {
    form.reset(toFormValues(settings))
  }, [settings, form])

  useEffect(() => {
    void api.documents
      .printers()
      .then(setPrinters)
      .catch(() => setPrinters([]))
  }, [])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const input: SettingsInput = {
        templeName: values.templeName.trim(),
        address: values.address?.trim() ?? '',
        phone: values.phone?.trim() ?? '',
        email: values.email?.trim() ?? '',
        header: values.header?.trim() ?? '',
        footer: values.footer?.trim() ?? '',
        receiptPrefix: normalisePrefix(values.receiptPrefix),
        authorizedSignatory: values.authorizedSignatory?.trim() ?? '',
        printerName: values.printerName === SYSTEM_PRINTER ? '' : (values.printerName ?? ''),
        printCopies: Number(values.printCopies),
        printSilent: Boolean(values.printSilent),
        backupFolder: values.backupFolder ?? '',
      }

      const updated = await api.settings.update(input)
      onSaved(updated)
      notify.success('Settings saved')
    } catch (error) {
      notify.error(error, 'Could not save the settings.')
    } finally {
      setSaving(false)
    }
  })

  const runLogoAction = async (action: () => Promise<Settings>, message: string) => {
    setLogoBusy(true)
    try {
      onSaved(await action())
      notify.success(message)
    } catch (error) {
      notify.error(error, 'Could not update the logo.')
    } finally {
      setLogoBusy(false)
    }
  }

  const chooseBackupFolder = async () => {
    try {
      const folder = await api.settings.chooseBackupFolder()
      if (folder) {
        form.setValue('backupFolder', folder, { shouldDirty: true })
        notify.success('Backup folder updated', folder)
      }
    } catch (error) {
      notify.error(error, 'Could not change the backup folder.')
    }
  }

  const errors = form.formState.errors
  const prefixPreview = previewReceiptNumber(form.watch('receiptPrefix') || '', 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Temple Details</CardTitle>
          <CardDescription>Printed at the top of every receipt and report.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="templeName" required>
              Temple Name
            </Label>
            <Input id="templeName" {...form.register('templeName')} aria-invalid={Boolean(errors.templeName)} />
            {errors.templeName ? <p className="field-error">{errors.templeName.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register('phone')} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...form.register('address')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register('email')} aria-invalid={Boolean(errors.email)} />
            {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Temple Logo</Label>
            <div className="flex items-center gap-3">
              {settings.logoDataUrl ? (
                <img
                  src={settings.logoDataUrl}
                  alt="Temple logo"
                  className="h-14 w-14 rounded-md border border-border bg-white object-contain p-1"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                  None
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={logoBusy}
                onClick={() => void runLogoAction(api.settings.uploadLogo, 'Logo updated')}
              >
                <ImagePlus aria-hidden />
                {settings.logo ? 'Replace' : 'Upload'}
              </Button>

              {settings.logo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={logoBusy}
                  onClick={() => void runLogoAction(api.settings.clearLogo, 'Logo removed')}
                  aria-label="Remove logo"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Layout</CardTitle>
          <CardDescription>Numbering and the fixed text printed on each receipt.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiptPrefix" required>
              Receipt Prefix
            </Label>
            <Input
              id="receiptPrefix"
              className="uppercase"
              {...form.register('receiptPrefix')}
              aria-invalid={Boolean(errors.receiptPrefix)}
            />
            {errors.receiptPrefix ? (
              <p className="field-error">{errors.receiptPrefix.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Next number will look like <span className="font-medium tabular">{prefixPreview}</span>. The
                running number resets to 00001 every 1 April.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="authorizedSignatory">Authorised Signatory</Label>
            <Input id="authorizedSignatory" {...form.register('authorizedSignatory')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="header">Header Title</Label>
            <Input id="header" placeholder="DONATION RECEIPT" {...form.register('header')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="footer">Footer Text</Label>
            <Textarea id="footer" rows={2} {...form.register('footer')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Printer</CardTitle>
          <CardDescription>Applies to receipts and reports printed from this computer.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Printer</Label>
            <Select
              value={form.watch('printerName') || SYSTEM_PRINTER}
              onValueChange={(value) => form.setValue('printerName', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SYSTEM_PRINTER}>System default</SelectItem>
                {printers.map((printer) => (
                  <SelectItem key={printer.name} value={printer.name}>
                    {printer.displayName}
                    {printer.isDefault ? ' (default)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="printCopies">Copies</Label>
            <Input
              id="printCopies"
              inputMode="numeric"
              {...form.register('printCopies')}
              aria-invalid={Boolean(errors.printCopies)}
            />
            {errors.printCopies ? <p className="field-error">{errors.printCopies.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="printSilent">Skip print dialog</Label>
            <div className="flex h-10 items-center gap-3">
              <Switch
                id="printSilent"
                checked={Boolean(form.watch('printSilent'))}
                onCheckedChange={(checked) => form.setValue('printSilent', checked, { shouldDirty: true })}
              />
              <span className="text-sm text-muted-foreground">
                {form.watch('printSilent') ? 'Print straight away' : 'Show the print dialog'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <Label htmlFor="backupFolder">Backup Folder</Label>
            <div className="flex gap-2">
              <Input id="backupFolder" readOnly className="flex-1" {...form.register('backupFolder')} />
              <Button type="button" variant="outline" onClick={() => void chooseBackupFolder()}>
                <FolderOpen aria-hidden />
                Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          <Save aria-hidden />
          Save Settings
        </Button>
      </div>
    </form>
  )
}

function toFormValues(settings: Settings): FormValues {
  return {
    templeName: settings.templeName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    header: settings.header,
    footer: settings.footer,
    receiptPrefix: settings.receiptPrefix,
    authorizedSignatory: settings.authorizedSignatory,
    printerName: settings.printerName || SYSTEM_PRINTER,
    printCopies: String(settings.printCopies),
    printSilent: settings.printSilent,
    backupFolder: settings.backupFolder,
  }
}
