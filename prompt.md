# Prompt: Build Temple Donation Receipt Management Desktop Application

You are a senior Electron, React, TypeScript, and Prisma architect.

Build a **production-ready desktop application** for **Temple Donation Receipt Management**.

## Tech Stack

Use exactly the following technologies:

* Electron
* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Zustand
* Prisma ORM
* SQLite
* dayjs
* pdf-lib
* ExcelJS
* Electron Builder

The application must be completely **offline**.

No backend server.

No cloud database.

All data must be stored locally using SQLite.

The code must be modular, scalable, and production-ready.

Follow Clean Architecture and SOLID principles.

---

# Functional Requirements

## Dashboard

Display:

* Today's Total Donation
* This Month Donation
* Total Receipts
* Recent Receipts
* Quick Actions

---

## Donation Receipt

Create a donation receipt.

Automatically generate:

Receipt Number

Format:

PDJM-2026/27-00001

Business Rules

* Running number increments automatically.
* Indian Financial Year (1 April – 31 March).
* Reset sequence to 00001 every 1 April.
* Financial year updates automatically.

Store sequence in the database.

---

## Receipt Date

Automatically capture:

* Date
* Time

Store using Indian Standard Time.

---

## Donor Information

Fields

* Donor Name
* Donor Address

---

## Donation Details

Allow multiple donation entries.

Each entry contains:

* Section Name (Dropdown)
* Donation Amount
* Remarks

Users can:

* Add Row
* Delete Row

---

## Payment Mode

Dropdown:

* Cash (Default)
* UPI
* NEFT
* Cheque

---

## Total Calculation

Automatically calculate:

Total Donation Amount

---

## Amount in Words

Automatically convert total amount into Indian numbering words.

Example:

₹1250

One Thousand Two Hundred Fifty Rupees Only

---

## Receipt Template

Generate a professional printable receipt.

Include:

Temple Header

Temple Logo

Receipt Number

Date

Time

Donor Name

Donor Address

Donation Table

Payment Mode

Total Amount

Amount in Words

Footer

Authorized Signature

Use pdf-lib.

Provide:

Download PDF

Print

---

## Receipt Management

Table

Columns

Receipt Number

Date

Donor Name

Payment Mode

Total Amount

Actions

Actions

* View
* Edit
* Delete
* Print Again
* Download PDF

Search by:

* Receipt Number
* Donor Name

Filters

* Date
* Payment Mode

Pagination

Sorting

Confirmation dialog before delete.

---

## Donation Report

Select:

From Date

To Date

Display

Receipt Number

Receipt Date

Donor Name

Address

Cash

UPI

NEFT

Cheque

Total

Grand Totals

Total Cash

Total UPI

Total NEFT

Total Cheque

Overall Donation

Export

PDF

Excel

CSV

Print

---

## Section Management

CRUD

Section Name

Examples

Annadanam

Temple Renovation

Festival Donation

General Donation

Special Pooja

Dropdown should load dynamically.

---

## Settings

Temple Name

Temple Address

Phone

Logo Upload

Header

Footer

Printer Settings

Backup Folder

---

## Backup

Backup SQLite database.

Restore database.

Export Backup.

Import Backup.

---

## Database

Use Prisma + SQLite.

Tables:

Settings

Sections

Receipts

ReceiptItems

Backups

Suggested schema:

Settings

* id
* templeName
* address
* phone
* logo
* header
* footer

Section

* id
* name
* isActive

Receipt

* id
* receiptNumber
* donorName
* donorAddress
* paymentMode
* totalAmount
* amountInWords
* createdAt
* updatedAt

ReceiptItem

* id
* receiptId
* sectionId
* amount
* remarks

---

## UI

Use shadcn/ui.

Responsive desktop layout.

Sidebar navigation:

Dashboard

New Receipt

Receipts

Reports

Sections

Settings

Modern cards

Tables

Dialogs

Forms

Professional spacing

Temple color theme.

---

## Validation

Use Zod.

Validate:

Required donor name

Minimum amount > 0

At least one donation row

Valid payment mode

---

## Printing

Use Electron Print API.

Print preview.

A4 layout.

---

## Project Structure

src/

* components/
* features/
* pages/
* layouts/
* hooks/
* services/
* lib/
* prisma/
* store/
* types/
* utils/
* electron/

Use feature-based architecture.

---

## Code Quality

Use:

TypeScript strict mode

Reusable components

Custom hooks

Repository pattern

Service layer

Error boundaries

Proper loading states

Toast notifications

Form validation

Consistent naming

No duplicated code

---

## Deliverables

1. Complete project structure.
2. Prisma schema.
3. SQLite integration.
4. Electron configuration.
5. Database services.
6. Receipt number generation logic.
7. Dashboard.
8. Receipt module.
9. Reports module.
10. Settings module.
11. PDF generation.
12. Printing.
13. Backup and Restore.
14. Build configuration with Electron Builder.
15. Installation instructions.
16. Production-ready code with comments where necessary.

The final application should look and behave like a professional accounting/ERP desktop application, be optimized for performance, and require no internet connection to operate.
