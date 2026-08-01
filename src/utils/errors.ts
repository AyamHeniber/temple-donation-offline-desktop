/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

export type AppErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DB'
  | 'IO'
  | 'PRINT'
  | 'CANCELLED'
  | 'UNKNOWN'

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly details?: string

  constructor(code: AppErrorCode, message: string, details?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }

  static validation(message: string, details?: string): AppError {
    return new AppError('VALIDATION', message, details)
  }

  static notFound(message = 'The requested record no longer exists.'): AppError {
    return new AppError('NOT_FOUND', message)
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message)
  }
}

export function toMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}
