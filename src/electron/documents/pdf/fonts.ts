/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, StandardFonts, type PDFFont } from 'pdf-lib'
import fs from 'node:fs'
import path from 'node:path'
import { createLogger } from '../../core/logger'
import { fontsDir, resourcesDir } from '../../core/paths'

const log = createLogger('pdf:fonts')

export interface FontSet {
  regular: PDFFont
  bold: PDFFont
  unicode: boolean
}

const FONT_EXTENSIONS = ['.ttf', '.otf']

const REGULAR_CANDIDATES = ['receipt.ttf', 'regular.ttf', 'NotoSans-Regular.ttf', 'NotoSansTamil-Regular.ttf']
const BOLD_CANDIDATES = ['receipt-bold.ttf', 'bold.ttf', 'NotoSans-Bold.ttf', 'NotoSansTamil-Bold.ttf']

function searchDirs(): string[] {
  return [fontsDir(), path.join(resourcesDir(), 'fonts')]
}

function findFont(candidates: string[]): string | null {
  for (const dir of searchDirs()) {
    for (const candidate of candidates) {
      const full = path.join(dir, candidate)
      if (fs.existsSync(full)) return full
    }
  }

  for (const dir of searchDirs()) {
    try {
      const found = fs
        .readdirSync(dir)
        .find((file) => FONT_EXTENSIONS.includes(path.extname(file).toLowerCase()))
      if (found) return path.join(dir, found)
    } catch {}
  }

  return null
}

export async function resolveFonts(doc: PDFDocument): Promise<FontSet> {
  const regularPath = findFont(REGULAR_CANDIDATES)

  if (regularPath) {
    try {
      doc.registerFontkit(fontkit)
      const boldPath = findFont(BOLD_CANDIDATES) ?? regularPath
      const regular = await doc.embedFont(fs.readFileSync(regularPath), { subset: true })
      const bold = await doc.embedFont(fs.readFileSync(boldPath), { subset: true })
      return { regular, bold, unicode: true }
    } catch (error) {
      log.warn(`Could not embed ${path.basename(regularPath)}; falling back to Helvetica`, error)
    }
  }

  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    unicode: false,
  }
}

const TRANSLITERATIONS: Array<[RegExp, string]> = [
  [/₹/g, 'Rs.'],
  [/[‘’‛]/g, "'"],
  [/[“”]/g, '"'],
  [/[–—]/g, '-'],
  [/…/g, '...'],
  [/ /g, ' '],
  [/[•●]/g, '*'],
]

export function encodeFor(fonts: FontSet, text: string): string {
  if (fonts.unicode) return text

  let out = text
  for (const [pattern, replacement] of TRANSLITERATIONS) out = out.replace(pattern, replacement)

  return out.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
}
