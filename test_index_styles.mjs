import { chromium } from 'playwright';
import http from 'http';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
      try {
        const content = await fsPromises.readFile(filePath);
        const ext = path.extname(filePath);
        const mimeTypes = {'.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript'};
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
      } catch (e) {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    server.listen(0, 'localhost', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

(async () => {
  const { server, port } = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();

  await page.goto(`http://localhost:${port}/distilleries/index.html`, { waitUntil: 'networkidle' });

  const styles = await page.evaluate(() => {
    const hero = document.querySelector('.hero');
    const table = document.querySelector('table');
    const section = document.querySelector('section');
    
    return {
      hero: hero ? {
        background: getComputedStyle(hero).backgroundColor,
        padding: getComputedStyle(hero).padding,
        borderRadius: getComputedStyle(hero).borderRadius
      } : null,
      section: section ? {
        background: getComputedStyle(section).backgroundColor,
        padding: getComputedStyle(section).padding,
        borderRadius: getComputedStyle(section).borderRadius
      } : null,
      table: table ? {
        display: getComputedStyle(table).display,
        width: getComputedStyle(table).width
      } : null
    };
  });

  console.log('Index page styles:');
  console.log(JSON.stringify(styles, null, 2));

  await context.close();
  await browser.close();
  server.close();
})();
