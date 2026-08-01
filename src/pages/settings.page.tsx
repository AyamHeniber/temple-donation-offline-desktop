/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, DatabaseBackup, Info } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingPanel } from '@/components/common/states'
import { SettingsForm } from '@/features/settings/components/settings-form'
import { BackupPanel } from '@/features/settings/components/backup-panel'
import { api } from '@/lib/api'
import { useAsync } from '@/hooks/use-async'
import { useAppStore } from '@/store/app-store'

type Tab = 'temple' | 'backup' | 'about'

const TABS: Tab[] = ['temple', 'backup', 'about']

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const setSettings = useAppStore((state) => state.setSettings)

  const requested = searchParams.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(requested && TABS.includes(requested) ? requested : 'temple')

  useEffect(() => {
    if (requested && TABS.includes(requested) && requested !== tab) setTab(requested)
  }, [requested, tab])

  const settings = useAsync(() => api.settings.get(), [])
  const info = useAsync(() => api.app.info(), [])

  if (settings.initialising) return <LoadingPanel label="Loading settings…" />

  if (settings.error || !settings.data) {
    return (
      <ErrorState
        message={settings.error ?? 'Settings could not be loaded.'}
        onRetry={() => void settings.refresh()}
      />
    )
  }

  return (
    <>
      <PageHeader title="Settings" description="Temple identity, printing and data safety." />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Tab)
          setSearchParams(value === 'temple' ? {} : { tab: value }, { replace: true })
        }}
      >
        <TabsList>
          <TabsTrigger value="temple">
            <Building2 aria-hidden />
            Temple
          </TabsTrigger>
          <TabsTrigger value="backup">
            <DatabaseBackup aria-hidden />
            Backup & Restore
          </TabsTrigger>
          <TabsTrigger value="about">
            <Info aria-hidden />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temple">
          <SettingsForm
            settings={settings.data}
            onSaved={(updated) => {
              settings.setData(updated)
              setSettings(updated)
            }}
          />
        </TabsContent>

        <TabsContent value="backup">
          <BackupPanel />
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About DonationBox</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                DonationBox runs entirely on this computer. It makes no network requests and stores every
                receipt in a local SQLite database.
              </p>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row label="Version" value={info.data?.version} />
                <Row label="Electron" value={info.data?.electron} />
                <Row label="Platform" value={info.data?.platform} />
                <Row label="Mode" value={info.data?.isPackaged ? 'Installed' : 'Development'} />
                <Row label="Database file" value={info.data?.databasePath} wide />
                <Row label="Data folder" value={info.data?.userDataPath} wide />
                <Row label="Backup folder" value={info.data?.backupFolder} wide />
              </dl>

              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                <p className="font-medium">Copyright &copy; 2026 Ayam Heniber Meitei</p>
                <p className="mt-0.5 text-muted-foreground">
                  Developed by Ayam Heniber Meitei &middot;{' '}
                  <span className="selectable">ayamheniber0@gmail.com</span>
                </p>
              </div>

              {info.data ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => void api.app.openPath(info.data!.userDataPath)}>
                    Open data folder
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void api.app.openPath(info.data!.backupFolder)}>
                    Open backup folder
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

function Row({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="selectable mt-0.5 break-all font-medium">{value ?? '—'}</dd>
    </div>
  )
}
