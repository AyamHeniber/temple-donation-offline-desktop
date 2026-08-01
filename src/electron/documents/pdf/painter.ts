/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { encodeFor, type FontSet } from './fonts'

export const A4_PORTRAIT: [number, number] = [595.28, 841.89]
export const A4_LANDSCAPE: [number, number] = [841.89, 595.28]

export const COLORS = {
  text: rgb(0.11, 0.09, 0.08),
  muted: rgb(0.42, 0.38, 0.35),
  primary: rgb(0.65, 0.24, 0.05),
  line: rgb(0.78, 0.74, 0.7),
  headerFill: rgb(0.98, 0.94, 0.87),
  zebra: rgb(0.985, 0.975, 0.965),
  white: rgb(1, 1, 1),
} as const

export type Align = 'left' | 'center' | 'right'

export interface TextOptions {
  size?: number
  bold?: boolean
  color?: RGB
  align?: Align
  maxWidth?: number
  lineHeight?: number
}

export interface TableColumn {
  header: string
  width: number
  align?: Align
  value: (row: never, index: number) => string
}

export class Painter {
  readonly doc: PDFDocument
  readonly fonts: FontSet
  readonly size: [number, number]
  readonly margin: number

  page: PDFPage
  y: number

  private constructor(doc: PDFDocument, fonts: FontSet, size: [number, number], margin: number) {
    this.doc = doc
    this.fonts = fonts
    this.size = size
    this.margin = margin
    this.page = doc.addPage(size)
    this.y = size[1] - margin
  }

  static async create(
    fonts: (doc: PDFDocument) => Promise<FontSet>,
    size: [number, number] = A4_PORTRAIT,
    margin = 42,
  ): Promise<Painter> {
    const doc = await PDFDocument.create()
    const fontSet = await fonts(doc)
    return new Painter(doc, fontSet, size, margin)
  }

  get width(): number {
    return this.size[0]
  }

  get height(): number {
    return this.size[1]
  }

  get contentWidth(): number {
    return this.width - this.margin * 2
  }

  get left(): number {
    return this.margin
  }

  get right(): number {
    return this.width - this.margin
  }

  font(bold = false): PDFFont {
    return bold ? this.fonts.bold : this.fonts.regular
  }

  clean(text: string): string {
    return encodeFor(this.fonts, text ?? '')
  }

  widthOf(text: string, size: number, bold = false): number {
    return this.font(bold).widthOfTextAtSize(this.clean(text), size)
  }

  newPage(): void {
    this.page = this.doc.addPage(this.size)
    this.y = this.height - this.margin
  }

  ensureSpace(needed: number): boolean {
    if (this.y - needed >= this.margin) return false
    this.newPage()
    return true
  }

  moveDown(amount: number): void {
    this.y -= amount
  }

  wrap(text: string, size: number, maxWidth: number, bold = false): string[] {
    const cleaned = this.clean(text)
    if (!cleaned) return []

    const font = this.font(bold)
    const lines: string[] = []

    for (const paragraph of cleaned.split('\n')) {
      let current = ''

      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = current ? `${current} ${word}` : word

        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          current = candidate
          continue
        }

        if (current) lines.push(current)

        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = ''
          for (const char of word) {
            if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
              lines.push(chunk)
              chunk = char
            } else {
              chunk += char
            }
          }
          current = chunk
        } else {
          current = word
        }
      }

      lines.push(current)
    }

    return lines
  }

  truncate(text: string, size: number, maxWidth: number, bold = false): string {
    const cleaned = this.clean(text)
    const font = this.font(bold)
    if (font.widthOfTextAtSize(cleaned, size) <= maxWidth) return cleaned

    let out = cleaned
    while (out.length > 1 && font.widthOfTextAtSize(`${out}...`, size) > maxWidth) {
      out = out.slice(0, -1)
    }
    return `${out}...`
  }

  private alignedX(text: string, x: number, size: number, options: TextOptions): number {
    const align = options.align ?? 'left'
    if (align === 'left') return x

    const boxWidth = options.maxWidth ?? this.contentWidth
    const textWidth = this.widthOf(text, size, options.bold)
    return align === 'center' ? x + (boxWidth - textWidth) / 2 : x + boxWidth - textWidth
  }

  drawAt(text: string, x: number, baseline: number, options: TextOptions = {}): void {
    const size = options.size ?? 10
    const cleaned = this.clean(text)
    if (!cleaned) return

    this.page.drawText(cleaned, {
      x: this.alignedX(cleaned, x, size, options),
      y: baseline,
      size,
      font: this.font(options.bold),
      color: options.color ?? COLORS.text,
    })
  }

  drawBlock(text: string, options: TextOptions = {}): number {
    const size = options.size ?? 10
    const lineHeight = options.lineHeight ?? size * 1.35
    const maxWidth = options.maxWidth ?? this.contentWidth
    const lines = this.wrap(text, size, maxWidth, options.bold)

    for (const line of lines) {
      this.ensureSpace(lineHeight)
      this.y -= lineHeight
      this.drawAt(line, this.left, this.y, { ...options, size, maxWidth })
    }

    return lines.length * lineHeight
  }

  hr(options: { color?: RGB; thickness?: number; gap?: number } = {}): void {
    const gap = options.gap ?? 8
    this.y -= gap
    this.page.drawLine({
      start: { x: this.left, y: this.y },
      end: { x: this.right, y: this.y },
      thickness: options.thickness ?? 0.8,
      color: options.color ?? COLORS.line,
    })
    this.y -= gap
  }

  rect(x: number, y: number, width: number, height: number, fill?: RGB, border?: RGB): void {
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      ...(fill ? { color: fill } : {}),
      ...(border ? { borderColor: border, borderWidth: 0.7 } : {}),
    })
  }

  async toBytes(): Promise<Uint8Array> {
    return this.doc.save()
  }
}
