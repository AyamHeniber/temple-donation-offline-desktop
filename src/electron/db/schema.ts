/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "templeName" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "header" TEXT NOT NULL DEFAULT '',
    "footer" TEXT NOT NULL DEFAULT '',
    "receiptPrefix" TEXT NOT NULL DEFAULT 'PDJM',
    "authorizedSignatory" TEXT NOT NULL DEFAULT 'Authorised Signatory',
    "printerName" TEXT NOT NULL DEFAULT '',
    "printCopies" INTEGER NOT NULL DEFAULT 1,
    "printSilent" BOOLEAN NOT NULL DEFAULT false,
    "backupFolder" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "Section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Section_name_key" ON "Section"("name")`,
  `CREATE INDEX IF NOT EXISTS "Section_isActive_idx" ON "Section"("isActive")`,

  `CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNumber" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorAddress" TEXT NOT NULL DEFAULT '',
    "donorPhone" TEXT NOT NULL DEFAULT '',
    "paymentMode" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL DEFAULT '',
    "totalAmount" REAL NOT NULL,
    "amountInWords" TEXT NOT NULL,
    "receiptDate" DATETIME NOT NULL,
    "receiptDateKey" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_receiptDateKey_idx" ON "Receipt"("receiptDateKey")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_donorName_idx" ON "Receipt"("donorName")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_paymentMode_idx" ON "Receipt"("paymentMode")`,
  `CREATE INDEX IF NOT EXISTS "Receipt_financialYear_idx" ON "Receipt"("financialYear")`,

  `CREATE TABLE IF NOT EXISTS "ReceiptItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "sectionName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId")
      REFERENCES "Receipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReceiptItem_sectionId_fkey" FOREIGN KEY ("sectionId")
      REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ReceiptItem_receiptId_idx" ON "ReceiptItem"("receiptId")`,
  `CREATE INDEX IF NOT EXISTS "ReceiptItem_sectionId_idx" ON "ReceiptItem"("sectionId")`,

  `CREATE TABLE IF NOT EXISTS "ReceiptSequence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prefix" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ReceiptSequence_prefix_financialYear_key"
     ON "ReceiptSequence"("prefix", "financialYear")`,

  `CREATE TABLE IF NOT EXISTS "Backup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Backup_createdAt_idx" ON "Backup"("createdAt")`,
]
