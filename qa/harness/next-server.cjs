'use strict';
const http = require('node:http');
const next = require('next');
if (!process.plutusQaGuard) throw new Error('QA guard missing in Next server');
const port = Number(process.env.PLUTUS_QA_FRONTEND_PORT);
const app = next({ dev: true, webpack: true, dir: process.cwd(), hostname: '127.0.0.1', port });
const sockets = new Set();
let server;
let closing = false;
async function close(exitCode = 0) {
  if (closing) return;
  closing = true;
  for (const socket of sockets) socket.destroy();
  if (server) await new Promise((resolve) => server.close(resolve));
  await app.close();
  process.exit(exitCode);
}
process.on('message', (message) => { if (message === 'qa-close') close().catch((error) => { console.error(error.message); process.exit(1); }); });
process.on('SIGTERM', () => close().catch((error) => { console.error(error.message); process.exit(1); }));
(async () => {
  await app.prepare();
  const handler = app.getRequestHandler();
  server = http.createServer((request, response) => {
    if (request.url === '/__qa/ready') { response.setHeader('content-type', 'application/json'); response.end(JSON.stringify({ ready: true, guard: process.plutusQaGuard === true })); return; }
    handler(request, response);
  });
  server.on('connection', (socket) => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  process.send?.({ type: 'qa-ready', port });
})().catch(async (error) => { console.error(error); try { await close(1); } catch (cleanupError) { console.error(cleanupError); process.exit(1); } });
