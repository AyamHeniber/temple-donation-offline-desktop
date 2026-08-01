/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { TempleApi } from './ipc'

declare global {
  interface Window {
    api: TempleApi
  }
}

export {}
