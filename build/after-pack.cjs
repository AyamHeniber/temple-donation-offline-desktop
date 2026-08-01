/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

const fs = require('node:fs')
const path = require('node:path')

const ENGINE_FOR_PLATFORM = {
  win32: /^query_engine-windows.*\.node$/i,
  darwin: /^libquery_engine-darwin.*\.node$/i,
  linux: /^libquery_engine-(?:debian|rhel|linux).*\.node$/i,
}

exports.default = async function afterPack(context) {
  const dir = path.join(context.appOutDir, 'resources', 'app.asar.unpacked', 'prisma-client')
  if (!fs.existsSync(dir)) return

  const keep = ENGINE_FOR_PLATFORM[context.electronPlatformName]
  if (!keep) return

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.node') || keep.test(file)) continue
    fs.rmSync(path.join(dir, file), { force: true })
    console.log(`  • dropped foreign Prisma engine  file=${file}`)
  }
}
