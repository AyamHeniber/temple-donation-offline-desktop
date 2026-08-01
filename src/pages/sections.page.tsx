/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useState } from 'react'
import { ListTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/states'
import { SectionDialog } from '@/features/sections/components/section-dialog'
import type { Section, SectionInput } from '@/types/domain'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { useAsync } from '@/hooks/use-async'
import { useDataChanged } from '@/hooks/use-data-changed'
import { formatDate } from '@/utils/date'

export function SectionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const sections = useAsync(() => api.sections.list(true), [])
  useDataChanged('sections', () => void sections.refresh())

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (section: Section) => {
    setEditing(section)
    setDialogOpen(true)
  }

  const handleSubmit = async (input: SectionInput) => {
    setSubmitting(true)
    try {
      if (editing) {
        await api.sections.update(editing.id, input)
        notify.success('Section updated', input.name)
      } else {
        await api.sections.create(input)
        notify.success('Section created', input.name)
      }
      setDialogOpen(false)
      await sections.refresh()
    } catch (error) {
      notify.error(error, 'Could not save the section.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (section: Section, isActive: boolean) => {
    setTogglingId(section.id)
    try {
      await api.sections.update(section.id, {
        name: section.name,
        description: section.description,
        sortOrder: section.sortOrder,
        isActive,
      })
      await sections.refresh()
    } catch (error) {
      notify.error(error, 'Could not update the section.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (section: Section) => {
    try {
      await api.sections.remove(section.id)
      notify.success('Section deleted', section.name)
      await sections.refresh()
    } catch (error) {
      notify.error(error, 'Could not delete the section.')
    }
  }

  const rows = sections.data ?? []

  return (
    <>
      <PageHeader
        title="Donation Sections"
        description="The donation heads offered on every receipt."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            New Section
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {sections.initialising ? (
            <TableSkeleton rows={5} columns={5} />
          ) : sections.error ? (
            <ErrorState message={sections.error} onRetry={() => void sections.refresh()} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ListTree}
              title="No sections yet"
              description="Create the donation heads your temple collects under, then start issuing receipts."
              action={
                <Button onClick={openCreate}>
                  <Plus aria-hidden />
                  New Section
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">Order</TableHead>
                  <TableHead>Section Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32 text-center">Used In</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="text-center text-muted-foreground tabular">
                      {section.sortOrder}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Added {formatDate(section.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[24rem] truncate text-muted-foreground">
                      {section.description || '—'}
                    </TableCell>

                    <TableCell className="text-center">
                      {section.usageCount ? (
                        <Badge variant="muted">{section.usageCount} entries</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not used</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.isActive}
                          disabled={togglingId === section.id}
                          onCheckedChange={(checked) => void toggleActive(section, checked)}
                          aria-label={`Toggle ${section.name}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {section.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(section)}
                          aria-label={`Edit ${section.name}`}
                        >
                          <Pencil />
                        </Button>

                        <ConfirmDialog
                          destructive
                          title="Delete this section?"
                          description={
                            section.usageCount ? (
                              <>
                                <strong>{section.name}</strong> is used by {section.usageCount} receipt
                                entries and cannot be deleted. Turn it off instead to hide it from new
                                receipts.
                              </>
                            ) : (
                              <>
                                <strong>{section.name}</strong> will be permanently removed.
                              </>
                            )
                          }
                          confirmLabel="Delete section"
                          onConfirm={() => handleDelete(section)}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${section.name}`}>
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

      <SectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        section={editing}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </>
  )
}
