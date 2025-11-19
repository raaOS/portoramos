#!/usr/bin/env node
const { spawn } = require('child_process')
const net = require('net')

function isFree(port){
  return new Promise((resolve)=>{
    const srv = net.createServer()
    srv.once('error', ()=> resolve(false))
    srv.once('listening', ()=> { srv.close(()=> resolve(true)) })
    srv.listen(port, '0.0.0.0')
  })
}

async function findPort(start=3000, max=3000){
  for (let p=start; p<=max; p++){
    if (await isFree(p)) return p
  }
  throw new Error('Port 3000 sedang digunakan. Silakan hentikan proses yang menggunakan port 3000 terlebih dahulu.')
}

(async () => {
  const port = await findPort().catch((e)=>{ console.error(e.message); process.exit(1) })
  const child = spawn('node', ['./node_modules/next/dist/bin/next', 'dev', '-p', String(port)], { stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 0))
})()

