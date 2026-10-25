const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3005;
const PUBLIC_DIR = __dirname;
const RASM_DIR = path.join(__dirname, 'rasm');

// 'rasm' jildi mavjudligini ta'minlash
if (!fs.existsSync(RASM_DIR)) {
  fs.mkdirSync(RASM_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Rasmni saqlash API
  if (req.method === 'POST' && req.url === '/save-photo') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const { image } = JSON.parse(body);
        if (!image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Rasm ma'lumoti topilmadi" }));
        }

        // Base64 prefiksini olib tashlash (data:image/png;base64,...)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const filename = `rasm_${timestamp}.png`;
        const filePath = path.join(RASM_DIR, filename);

        fs.writeFile(filePath, buffer, err => {
          if (err) {
            console.error('Rasmni saqlashda xatolik:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: "Rasmni saqlab bo'lmadi" }));
          }

          console.log(`[+] Rasm saqlandi: rasm/${filename}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, filename }));
        });
      } catch (err) {
        console.error('So\'rovni o\'qishda xatolik:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Noto'g'ri so'rov formati" }));
      }
    });
    return;
  }

  // Statik fayllarni ulash
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Topilmadi');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`===============================================`);
    console.log(`Sayt ishga tushdi: http://localhost:${port}`);
    console.log(`Rasmlar saqlanadigan jild: ${RASM_DIR}`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} band, port ${port + 1} tekshirilmoqda...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('Serverda xatolik:', err);
    }
  });
}

startServer(DEFAULT_PORT);
