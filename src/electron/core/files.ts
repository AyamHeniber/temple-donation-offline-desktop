/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import fs from 'node:fs'
import path from 'node:path'
import { AppError } from '@/utils/errors'

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export function imageMimeFor(filePath: string): string | null {
  return IMAGE_MIME[path.extname(filePath).toLowerCase()] ?? null
}

export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

export function readImageAsDataUrl(filePath: string): string | null {
  if (!fileExists(filePath)) return null
  const mime = imageMimeFor(filePath)
  if (!mime) return null

  try {
    return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`
  } catch {
    return null
  }
}

export function writeFileBytes(filePath: string, data: Uint8Array | string): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, data)
  } catch (error) {
    throw new AppError('IO', `Could not write ${path.basename(filePath)}.`, String(error))
  }
}

export function copyFileSafe(from: string, to: string): void {
  try {
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(from, to)
  } catch (error) {
    throw new AppError('IO', `Could not copy to ${path.basename(to)}.`, String(error))
  }
}

export function removeIfExists(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true })
  } catch {}
}

export function fileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size
  } catch {
    return 0
  }
}

