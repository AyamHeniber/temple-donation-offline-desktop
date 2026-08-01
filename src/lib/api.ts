/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { TempleApi } from '@/types/ipc'

export function getApi(): TempleApi {
  const api = typeof window !== 'undefined' ? window.api : undefined

  if (!api) {
    throw new Error(
      'The application bridge is unavailable. Please restart DonationBox — ' +
        'this window must run inside the desktop shell.',
    )
  }

  return api
}

export const api: TempleApi = new Proxy({} as TempleApi, {
  get(_target, prop: keyof TempleApi) {
    return getApi()[prop]
  },
})

export function isBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.api)
}

export function errorCode(error: unknown): string {
  return (error as { code?: string })?.code ?? 'UNKNOWN'
}

export function isCancelled(error: unknown): boolean {
  return errorCode(error) === 'CANCELLED'
}
