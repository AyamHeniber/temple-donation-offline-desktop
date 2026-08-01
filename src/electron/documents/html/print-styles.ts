/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

export function printStyles(orientation: 'portrait' | 'landscape' = 'portrait'): string {
  return `
    @page { size: A4 ${orientation}; margin: ${orientation === 'portrait' ? '14mm 12mm' : '10mm'}; }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #1c1917;
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: ${orientation === 'portrait' ? '12px' : '10px'};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sheet { width: 100%; }

    .temple-header { text-align: center; position: relative; padding-bottom: 8px; }
    .temple-header .logo {
      position: absolute; left: 0; top: 0;
      width: 62px; height: 62px; object-fit: contain;
    }
    .temple-name { font-size: 1.75em; font-weight: 700; color: #a63d0c; margin: 0 0 4px; letter-spacing: .3px; }
    .temple-meta { font-size: .92em; color: #6b625c; margin: 2px 0; }

    .rule { border: none; border-top: 2px solid #a63d0c; margin: 8px 0 0; }

    .doc-title {
      margin: 10px 0 12px;
      padding: 6px 0;
      background: #fbf1e3;
      color: #a63d0c;
      text-align: center;
      font-weight: 700;
      font-size: 1.25em;
      letter-spacing: 1.5px;
    }

    .meta-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 4px 16px; margin-bottom: 12px;
    }
    .meta-grid .right { text-align: right; }
    .meta-label { color: #6b625c; }
    .meta-value { font-weight: 700; }

    .donor-box { border: 1px solid #d9d2cb; border-radius: 4px; padding: 10px 12px; margin-bottom: 14px; }
    .donor-box .label { color: #6b625c; font-size: .88em; margin-bottom: 3px; }
    .donor-box .name { font-weight: 700; font-size: 1.15em; }
    .donor-box .addr { color: #4b443f; margin-top: 2px; white-space: pre-wrap; }

    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th, td { border: 1px solid #d9d2cb; padding: 6px 8px; vertical-align: top; }
    th { background: #fbf1e3; font-weight: 700; text-align: left; }
    th.num, td.num { text-align: right; white-space: nowrap; }
    th.ctr, td.ctr { text-align: center; }
    tbody tr:nth-child(even) { background: #fcfaf8; }
    td.muted { color: #6b625c; }

    tfoot td { background: #fbf1e3; font-weight: 700; }

    .summary { margin-top: 14px; }
    .summary .label { color: #6b625c; font-size: .88em; }
    .summary .words { font-weight: 700; margin: 2px 0 10px; }

    .signature { margin-top: 40px; text-align: right; page-break-inside: avoid; }
    .signature .line { display: inline-block; width: 190px; border-top: 1px solid #b8afa8; padding-top: 5px; font-weight: 700; }

    .doc-footer { margin-top: 16px; text-align: center; color: #6b625c; font-size: .88em; }
    .disclaimer { margin-top: 6px; text-align: center; color: #8a817b; font-size: .78em; }

    .section-summary { margin-top: 18px; page-break-inside: avoid; }
    .section-summary h2 { font-size: 1.05em; margin: 0 0 6px; }
    .section-summary table { width: 60%; }
  `
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function htmlDocument(title: string, styles: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline';" />
<title>${escapeHtml(title)}</title>
<style>${styles}</style>
</head>
<body><div class="sheet">${body}</div></body>
</html>`
}
