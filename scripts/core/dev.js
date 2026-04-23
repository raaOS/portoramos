#!/usr/bin/env node
const { spawn } = require('child_process')
const net = require('net')

function resolveNextCli() {
  try {
    return require.resolve('next/dist/bin/next')
  } catch {
    console.error('Next.js belum terpasang dengan benar. Jalankan ulang `npm install` agar dependency sinkron.')
    process.exit(1)
  }
}

function isFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => { srv.close(() => resolve(true)) })
    srv.listen(port, '0.0.0.0')
  })
}

async function findPort(start = 3000, max = 3000) {
  for (let p = start; p <= max; p++) {
    if (await isFree(p)) return p
  }
  throw new Error('Port 3000 sedang digunakan. Silakan hentikan proses yang menggunakan port 3000 terlebih dahulu.')
}

(async () => {
  const port = await findPort().catch((e) => { console.error(e.message); process.exit(1) })
  const forwardedArgs = process.argv.slice(2)
  const hasBundlerFlag = forwardedArgs.some((arg) => ['--webpack', '--turbopack', '--turbo'].includes(arg))
  const defaultBundlerArgs = process.platform === 'win32' && !hasBundlerFlag ? ['--webpack'] : []
  const args = [resolveNextCli(), 'dev', '-p', String(port), ...defaultBundlerArgs, ...forwardedArgs]
  const child = spawn(process.execPath, args, { stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 0))
})()

