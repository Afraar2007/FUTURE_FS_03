import fs from 'node:fs';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const port = Number(process.env.PORT ?? 4173);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'dist', 'server', 'server.js');
const serverUrl = pathToFileURL(serverPath).href;
const staticDir = path.join(__dirname, 'dist', 'client');

const serverEntry = await import(serverUrl);
const handler = serverEntry.default ?? serverEntry;

if (!handler || typeof handler.fetch !== 'function') {
  throw new Error(`Invalid server entry imported from ${serverPath}`);
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

async function serveStaticFile(staticFile, res) {
  try {
    await fs.promises.access(staticFile);
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    const stream = createReadStream(staticFile);
    stream.on('error', () => {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      resolve(false);
    });
    stream.on('open', () => {
      res.writeHead(200, { 'Content-Type': getMimeType(staticFile) });
      stream.pipe(res);
      resolve(true);
    });
  });
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `localhost:${port}`;
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const requestUrl = new URL(req.url ?? '/', `${protocol}://${host}`);

    if (req.method === 'GET' || req.method === 'HEAD') {
      const pathname = requestUrl.pathname;
      if (pathname.startsWith('/assets/') || pathname === '/favicon.ico') {
        const staticFile = path.join(staticDir, pathname.replace(/^\//, ''));
        const handled = await serveStaticFile(staticFile, res);
        if (handled) {
          return;
        }
      }
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(name, value);
      } else if (Array.isArray(value)) {
        headers.set(name, value.join(', '));
      }
    }

    const body = req.method === 'GET' || req.method === 'HEAD' ? null : await getRequestBody(req);
    const request = new Request(requestUrl.toString(), {
      method: req.method,
      headers,
      body: body && body.length > 0 ? body : null,
    });

    const response = await handler.fetch(request, undefined, undefined);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

    if (response.body) {
      if (typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } else if (typeof response.body.pipe === 'function') {
        response.body.pipe(res);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        res.end(Buffer.from(arrayBuffer));
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(error));
  }
});

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
});
