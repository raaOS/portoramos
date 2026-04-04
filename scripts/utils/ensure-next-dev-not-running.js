#!/usr/bin/env node

const net = require('net');

function isPortActive(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finalize = (active) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(active);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, host);
  });
}

(async () => {
  const port = 3000;
  const isRunning = await isPortActive(port);

  if (!isRunning) {
    process.exit(0);
  }

  console.error(
    [
      `Port ${port} sedang dipakai. Kemungkinan \`npm run dev\` masih berjalan.`,
      'Hentikan dev server dulu sebelum menjalankan build atau clear-cache.',
      'Ini mencegah folder `.next/dev` terhapus saat server masih aktif.'
    ].join('\n')
  );

  process.exit(1);
})();
