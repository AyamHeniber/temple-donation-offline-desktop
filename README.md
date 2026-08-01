# DonationBox — Temple Donation Receipt Management

A fully offline desktop application for issuing, printing and reporting temple
donation receipts. No server, no cloud, no internet connection — every receipt
lives in a local SQLite database on the machine that issued it.

**Copyright © 2026 Ayam Heniber Meitei**
Developed by Ayam Heniber Meitei — ayamheniber0@gmail.com

Built with Electron, React, TypeScript, Vite, Tailwind CSS, shadcn/ui,
React Hook Form, Zod, Zustand, Prisma, dayjs, pdf-lib, ExcelJS and
Electron Builder.

---

## Features

| Module | What it does |
| --- | --- |
| **Dashboard** | Today / this month / financial-year collection, total receipts, 7-day trend, payment-mode split, top sections, recent receipts, quick actions |
| **New Receipt** | Auto-numbered receipts, multiple donation rows, live total, automatic amount-in-words, IST timestamp |
| **Receipts** | Search by number or donor, filter by date range / payment mode / section, sortable columns, pagination, view, edit, delete, print again, download PDF |
| **Reports** | From/to date range, per-receipt Cash / UPI / NEFT / Cheque columns, grand totals, section-wise summary, export to PDF / Excel / CSV, print |
| **Sections** | CRUD for donation heads, activate/deactivate, display order, deletion guarded when a section is in use. A new install ships with none — the temple defines its own |
| **Settings** | Temple name, address, phone, email, logo upload, receipt prefix, header/footer, authorised signatory, printer, copies, silent print, backup folder |
| **Backup** | Snapshot, restore, export and import the SQLite database, with an automatic safety snapshot before every restore |

### Receipt numbering

```
PDJM-2026/27-00001
└┬─┘ └──┬──┘ └─┬─┘
 │      │      └── running number, 5 digits, resets to 00001 each 1 April
 │      └───────── Indian financial year (1 April – 31 March)
 └──────────────── prefix, configurable in Settings
```

The counter is stored per `(prefix, financial year)` and reserved inside the
same database transaction that writes the receipt, so numbering is gapless and
the 1 April reset needs no scheduled job. Deleting a receipt never recycles its
number, and editing a receipt never changes it.

---

## First run

A fresh installation contains **no sample data of any kind** — no temple
details, no sections, no receipts. The dashboard shows a setup prompt until
both of the following are done:

1. **Settings → Temple** — enter the temple name and address. These print on
   every receipt and report.
2. **Sections** — create the donation heads you collect under (for example
   Annadanam, Temple Renovation, Special Pooja). At least one is required
   before a receipt can be issued.

The receipt prefix defaults to `PDJM` and can be changed in Settings at any
time; existing receipt numbers are never rewritten.

---

## Requirements

- **Node.js 18 or newer** (developed on Node 22)
- **npm 9+**
- Windows 10+, macOS 11+, or a modern Linux desktop

No database server is required — SQLite is embedded.

---

## Installation

```bash
npm install
```

`postinstall` runs `prisma generate`, which produces the typed client and the
native query engine used at runtime.

## Development

```bash
npm run dev
```

Vite serves the renderer with hot reload and launches Electron against it.
The main process rebuilds and restarts automatically on change.

Useful checks:

```bash
npm run typecheck        # TypeScript, strict mode, whole project
npm run build            # typecheck + production bundles into dist/ and dist-electron/
npm run prisma:studio    # inspect the development database in a browser
```

## Building installers

```bash
npm run dist         # installer for the current platform
npm run dist:win     # Windows NSIS installer
npm run dist:mac     # macOS DMG (x64 + arm64)
npm run dist:linux   # Linux AppImage + .deb
npm run dist:dir     # unpacked build, for quick manual testing
```

Output lands in `release/<version>/`.

### Building the Windows .exe

```bash
npm install        # once
npm run dist:win
```

The installer appears at `release/1.0.0/DonationBox-Setup-1.0.0-x64.exe`.
Double-click it on any Windows 10/11 64-bit PC — no admin rights, no Node.js,
no internet connection required on the target machine.

**This can be built from macOS or Linux as well as from Windows.** The app has
no compiled native modules; the only platform-specific binary is Prisma's query
engine, and `schema.prisma` requests both targets:

```prisma
binaryTargets = ["native", "windows"]
```

`prisma generate` therefore downloads the Windows engine alongside the local
one, and `src/electron/db/client.ts` selects the engine matching the platform
it is actually running on. If you add another OS target, add it here too.

- The installer is **per-user** (`perMachine: false`) — no administrator rights
  are required, and the app installs under `%LOCALAPPDATA%\Programs`.
- Data lives in `%APPDATA%\DonationBox`, so a Windows profile roams with its
  own receipts and the installer never touches them.
- Printing uses the default Windows printer unless one is chosen in Settings.
- The build is x64 only. For 32-bit or ARM hardware, add the architecture to
  the `win.target.arch` list in `electron-builder.yml` and rebuild on that
  machine.

Two Windows-specific details are handled in code and are worth knowing if you
ever touch the database layer:

1. Prisma names its engine `query_engine-windows.dll.node` on Windows but
   `libquery_engine-*.node` elsewhere, so the lookup in
   `src/electron/db/client.ts` matches both spellings.
2. SQLite connection URLs must use forward slashes, so the Windows path
   `C:\Users\…\donationbox.db` is normalised before being handed to Prisma.

---

## Where your data lives

Everything the app writes is under Electron's per-user data directory:

| Path | Contents |
| --- | --- |
| `donationbox.db` | The SQLite database — **this is your data** |
| `backups/` | Default backup destination (configurable in Settings) |
| `assets/` | Uploaded temple logo |
| `fonts/` | Optional Unicode font for PDF output (see below) |
| `logs/main.log` | Rolling application log |

The exact location is shown in **Settings → About**, and is typically:

- **Windows** — `%APPDATA%\DonationBox`
- **macOS** — `~/Library/Application Support/DonationBox`
- **Linux** — `~/.config/DonationBox`

### Backups

Take a backup at the end of each collection day and keep a copy on a separate
drive. A backup is a single self-contained `.db` file, captured after a WAL
checkpoint so it is always a consistent snapshot.

Restoring replaces **all** current data. The app snapshots the existing
database first (recorded as *Before restore*), then **restarts** — the restart
is not cosmetic, it is the step that performs the swap. A database cannot be
replaced underneath a live connection, so the chosen backup is staged and moved
into place at the next startup, before anything opens it.

If a restore was a mistake, restore the *Before restore* snapshot to undo it.
The Backups list reconciles itself with the folder on disk, so backup files
copied in from a USB drive appear automatically.

---

## Printing and PDFs

- **Download PDF** renders the document with **pdf-lib** — A4 portrait for
  receipts, A4 landscape for reports.
- **Print** uses the **Electron Print API**: the same document model is rendered
  to A4-styled HTML, loaded into an offscreen window and sent to the printer.
- The receipt preview embeds the real PDF bytes, so what you see is exactly what
  prints and downloads.
- Printer, number of copies and "skip the print dialog" are set in **Settings**.

### Non-Latin scripts and the ₹ symbol in PDFs

pdf-lib's built-in fonts use WinAnsi encoding, which cannot represent `₹` or any
Indic script. Without a Unicode font, PDFs fall back to Helvetica and print
amounts as `Rs. 1,250.00`. (On-screen and printed output are unaffected — those
use system fonts.)

To enable full Unicode in PDFs, drop a TrueType font into the `fonts/` folder
inside the data directory listed above:

```
fonts/receipt.ttf         regular
fonts/receipt-bold.ttf    bold (optional; falls back to regular)
```

Noto Sans and Noto Sans Tamil work well. Any `.ttf` or `.otf` in that folder is
picked up, and the folder is created automatically on first launch.

---

## Architecture

Clean layering, with the database reachable only from the main process:

```
Renderer (React)                Preload                 Main (Node)
────────────────                ───────                 ───────────
pages/ features/          →  contextBridge   →   ipc/  →  services/  →  repositories/  →  Prisma → SQLite
components/ hooks/ store/     window.api          envelope   business      data access
                                                             rules
```

```
src/
├── components/         shadcn/ui primitives + shared building blocks
├── features/           feature-scoped UI (receipts, reports, sections, settings, dashboard)
├── pages/              one file per route
├── layouts/            app shell, sidebar, topbar
├── hooks/              useAsync, useMutation, useDataChanged, useDebouncedValue
├── lib/                api client, Zod schemas, toasts, cn()
├── store/              Zustand app store (settings + sections)
├── types/              domain entities + the IPC contract
├── utils/              pure helpers (IST dates, financial year, currency, words, CSV)
├── prisma/             schema.prisma
└── electron/
    ├── core/           paths, logger, window, menu, files
    ├── db/             Prisma client, schema bootstrap, staged restore, mappers
    ├── repositories/   data access (repository pattern)
    ├── services/       business rules (receipt, report, dashboard, settings, section, backup, print, document)
    ├── documents/      one view-model, four presenters (PDF, print HTML, Excel, CSV)
    └── ipc/            channel registration + error envelope
```

Points worth knowing:

- **One document model, many outputs.** `ReceiptDocument` / `ReportDocument` are
  built once and consumed by the pdf-lib, HTML, ExcelJS and CSV renderers, so the
  PDF, the printout and the spreadsheet can never disagree.
- **Validation is shared, not duplicated.** Zod schemas in `src/lib/schemas.ts`
  back both the React Hook Form resolvers and the main-process services; the
  renderer cannot talk a request past the rules the database enforces.
- **IST is handled in one place.** Instants are stored as UTC; every receipt also
  carries `receiptDateKey` (an IST `YYYY-MM-DD`), which makes date filtering a
  plain string comparison and immune to timezone drift at day boundaries.
- **Section names are denormalised onto receipt items.** Renaming or
  deactivating a section never alters a receipt that has already been issued.
- **Errors cross IPC as `{ code, message }` envelopes**, never as stack traces,
  so the UI can show a stable message and a handler can never crash the app.
- **Restores are staged, not hot-swapped.** Replacing the database file while
  Prisma holds it open lets the engine write cached pages back over the restored
  data; the swap therefore happens at startup, before any connection exists.

### Security posture

- `contextIsolation` on, `nodeIntegration` off, no remote module.
- A Content-Security-Policy is applied to the app's own documents;
  `connect-src 'none'` in production — the packaged app cannot make a network
  request even if a dependency tried to.
- External links open in the system browser; in-app navigation away from the app
  origin is blocked.
- All permission requests are denied.
- Only one instance may run, so two windows can never open the same database.

---

## Troubleshooting

**"The local database could not be opened" on startup**
Restore a known-good backup from Settings → Backup & Restore, or move
`donationbox.db` aside and restart to begin with a fresh database.

**PDF preview shows a blank frame**
The preview uses Chromium's built-in PDF viewer. If a corporate policy disables
plugins, use **Download PDF** instead — the bytes are identical.

**Printing does nothing**
Check Settings → Printer. With *Skip print dialog* enabled, jobs go straight to
the selected printer; if that printer is offline the job is silently dropped by
the OS. Clear the printer selection to use the system default.

**Receipt numbers look out of step after restoring a backup**
The counter lives in the database, so it is restored along with everything else.
Numbers are never reused, so gaps after a deletion are expected and intentional.

**A restore seemed to do nothing**
The restore is applied while the app restarts. If DonationBox was closed before
it restarted, the restore is still pending and will be applied the next time it
opens.

**Logs**
`logs/main.log` in the data directory, or **Tools → Open Log Folder**.

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + N` | New receipt |
| `Ctrl/Cmd + L` | Receipts |
| `Ctrl/Cmd + R` | Reports |
| `Ctrl/Cmd + K` | Sections |
| `Ctrl/Cmd + D` | Dashboard |
| `Ctrl/Cmd + ,` | Settings |

---

## Credits

**Copyright © 2026 Ayam Heniber Meitei.**

Developed by Ayam Heniber Meitei
ayamheniber0@gmail.com# temple-donation-offline-desktop
