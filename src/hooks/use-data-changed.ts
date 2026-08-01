/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useRef } from 'react'
import { api, isBridgeAvailable } from '@/lib/api'
import type { DataDomain } from '@/types/ipc'

export function useDataChanged(domains: DataDomain | DataDomain[], handler: () => void): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const list = Array.isArray(domains) ? domains : [domains]
  const key = list.join(',')

  useEffect(() => {
    if (!isBridgeAvailable()) return

    const watched = new Set(key.split(',') as DataDomain[])
    return api.events.onDataChanged((domain) => {
      if (watched.has(domain)) handlerRef.current()
    })
  }, [key])
}
