const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8090;
const CONFIG_PATH = path.join(__dirname, 'config.yaml');
const EXAMPLE_CONFIG = path.join(__dirname, 'config.example.yaml');

// 如果当前不存在 config.yaml，则从示例复制一份
if (!fs.existsSync(CONFIG_PATH) && fs.existsSync(EXAMPLE_CONFIG)) {
  fs.copyFileSync(EXAMPLE_CONFIG, CONFIG_PATH);
}

// MIME 类型映射
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ---- API 路由 ----
  if (pathname === '/api/config') {
    if (req.method === 'GET') {
      try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        sendJson(res, 200, { ok: true, content });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: '读取配置失败: ' + err.message });
      }
      return;
    }

    if (req.method === 'PUT') {
      try {
        const body = await readBody(req);
        const { content } = JSON.parse(body);
        if (typeof content !== 'string') {
          sendJson(res, 400, { ok: false, error: '缺少 content 字段' });
          return;
        }
        // 备份旧配置
        if (fs.existsSync(CONFIG_PATH)) {
          const backup = CONFIG_PATH + '.bak';
          fs.copyFileSync(CONFIG_PATH, backup);
        }
        fs.writeFileSync(CONFIG_PATH, content, 'utf-8');
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: '保存配置失败: ' + err.message });
      }
      return;
    }

    res.writeHead(405);
    res.end();
    return;
  }

  // ---- 静态文件服务 ----
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end();
    return;
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n  🚀 ServiceHub 已启动: http://0.0.0.0:${PORT}\n`);
});
