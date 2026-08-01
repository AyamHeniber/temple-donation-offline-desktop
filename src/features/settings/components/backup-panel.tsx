/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useState } from 'react'
import {
  AlertTriangle,
  DatabaseBackup,
  FolderOpen,
  HardDriveDownload,
  HardDriveUpload,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/states'
import type { BackupRecord } from '@/types/domain'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { useAsync } from '@/hooks/use-async'
import { useDataChanged } from '@/hooks/use-data-changed'
import { formatDateTime } from '@/utils/date'

const TYPE_LABEL: Record<BackupRecord['type'], string> = {
  MANUAL: 'Manual',
  STARTUP: 'Automatic',
  PRE_RESTORE: 'Before restore',
  EXPORT: 'Export',
}

function humanSize(bytes: number): string {
  if (bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function BackupPanel() {
  const [busy, setBusy] = useState<'create' | 'import' | null>(null)
  const backups = useAsync(() => api.backup.list(), [])
  useDataChanged('backups', () => void backups.refresh())

  const createBackup = async () => {
    setBusy('create')
    try {
      const record = await api.backup.create('Manual backup')
      notify.success('Backup created', record.fileName)
      await backups.refresh()
    } catch (error) {
      notify.error(error, 'Could not create a backup.')
    } finally {
      setBusy(null)
    }
  }

  const finishRestore = async (safetyBackupPath?: string) => {
    notify.success(
      'Restoring — DonationBox will restart',
      safetyBackupPath ? `A snapshot of your current data was saved to ${safetyBackupPath}` : undefined,
    )
    window.setTimeout(() => void api.app.relaunch(), 1800)
  }

  const importBackup = async () => {
    setBusy('import')
    try {
      const result = await api.backup.importFrom()
      if (result.restored) await finishRestore(result.safetyBackupPath)
    } catch (error) {
      notify.error(error, 'Could not import that backup.')
    } finally {
      setBusy(null)
    }
  }

  const restore = async (record: BackupRecord) => {
    try {
      const result = await api.backup.restore(record.filePath)
      if (result.restored) await finishRestore(result.safetyBackupPath)
    } catch (error) {
      notify.error(error, 'Could not restore that backup.')
    }
  }

  const exportBackup = async (record: BackupRecord) => {
    try {
      const result = await api.backup.exportTo(record.id)
      if (result.saved) notify.success('Backup exported', result.filePath)
    } catch (error) {
      notify.error(error, 'Could not export that backup.')
    }
  }

  const removeBackup = async (record: BackupRecord) => {
    try {
      await api.backup.remove(record.id)
      notify.success('Backup deleted', record.fileName)
      await backups.refresh()
    } catch (error) {
      notify.error(error, 'Could not delete that backup.')
    }
  }

  const rows = backups.data ?? []

  return (
    <div className="space-y-6">
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p className="text-sm text-muted-foreground">
            All donation data lives in a single database file on this computer. Take a backup at the end of
            every collection day and keep a copy on a separate drive — a restore replaces{' '}
            <strong className="text-foreground">everything</strong> currently in the application.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Backups</CardTitle>
            <CardDescription>Snapshots of the local database, newest first.</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void api.backup.revealFolder()}>
              <FolderOpen aria-hidden />
              Open Folder
            </Button>
            <Button variant="outline" onClick={() => void importBackup()} loading={busy === 'import'}>
              <HardDriveUpload aria-hidden />
              Import Backup
            </Button>
            <Button onClick={() => void createBackup()} loading={busy === 'create'}>
              <DatabaseBackup aria-hidden />
              Backup Now
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {backups.initialising ? (
            <TableSkeleton rows={4} columns={4} />
          ) : backups.error ? (
            <ErrorState message={backups.error} onRetry={() => void backups.refresh()} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={DatabaseBackup}
              title="No backups yet"
              description="Create your first backup so today's collection can always be recovered."
              action={<Button onClick={() => void createBackup()}>Backup Now</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead className="w-44">Created</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-24 text-right">Size</TableHead>
                  <TableHead className="w-44 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium tabular">{record.fileName}</div>
                      <div className="max-w-[28rem] truncate text-xs text-muted-foreground">
                        {record.note || record.filePath}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap tabular">
                      {formatDateTime(record.createdAt)}
                    </TableCell>

                    <TableCell>
                      <Badge variant={record.type === 'PRE_RESTORE' ? 'warning' : 'muted'}>
                        {TYPE_LABEL[record.type]}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right tabular">{humanSize(record.sizeBytes)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void exportBackup(record)}
                          aria-label="Export backup"
                        >
                          <HardDriveDownload />
                        </Button>

                        <ConfirmDialog
                          title="Restore this backup?"
                          description={
                            <>
                              All current data will be replaced with the contents of{' '}
                              <strong>{record.fileName}</strong>. A safety copy of your current database is
                              taken first, then DonationBox restarts to apply the restore.
                            </>
                          }
                          confirmLabel="Restore and restart"
                          onConfirm={() => restore(record)}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Restore backup">
                              <RotateCcw />
                            </Button>
                          }
                        />

                        <ConfirmDialog
                          destructive
                          title="Delete this backup?"
                          description={
                            <>
                              <strong>{record.fileName}</strong> will be deleted from disk. This cannot be
                              undone.
                            </>
                          }
                          confirmLabel="Delete backup"
                          onConfirm={() => removeBackup(record)}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Delete backup">
                              <Trash2 className="text-destructive" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
