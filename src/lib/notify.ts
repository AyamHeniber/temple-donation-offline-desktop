/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { toast } from 'sonner'
import { isCancelled } from './api'
import { toMessage } from '@/utils/errors'

export const notify = {
  success(message: string, description?: string) {
    toast.success(message, description ? { description } : undefined)
  },

  info(message: string, description?: string) {
    toast(message, description ? { description } : undefined)
  },

  warning(message: string, description?: string) {
    toast.warning(message, description ? { description } : undefined)
  },

  error(error: unknown, fallback = 'Something went wrong.'): boolean {
    if (isCancelled(error)) return false
    toast.error(toMessage(error, fallback))
    return true
  },

  promise<T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) {
    return toast.promise(promise, messages)
  },
}
