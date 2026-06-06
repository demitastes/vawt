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
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  await page.goto(`http://localhost:${port}/distilleries/bradys.html`, { waitUntil: 'networkidle' });

  // Take screenshot of mobile
  const boutSection = await page.$('section:has(.bouts-table)');
  if (boutSection) {
    await boutSection.screenshot({ path: 'bout_table_mobile.png' });
    console.log('✅ Mobile screenshot saved');
  }

  // Check mobile styles
  const styles = await page.evaluate(() => {
    const row = document.querySelector('.bouts-table .bout-row');
    if (!row) return { error: 'Row not found' };
    
    return {
      display: getComputedStyle(row).display,
      flexDirection: getComputedStyle(row).flexDirection,
      gap: getComputedStyle(row).gap,
      padding: getComputedStyle(row).padding
    };
  });

  console.log('Mobile bout row styles:', JSON.stringify(styles, null, 2));

  await context.close();
  await browser.close();
  server.close();
})();
