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
        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript'
        };
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
  const context = await browser.newContext({ viewport: { width: 1024, height: 1280 } });
  const page = await context.newPage();

  await page.goto(`http://localhost:${port}/distilleries/bradys.html`, { waitUntil: 'networkidle' });

  // Take screenshot of the bout table area
  const boutSection = await page.$('section:has(.bouts-table)');
  if (boutSection) {
    await boutSection.screenshot({ path: 'bout_table_screenshot.png' });
    console.log('✅ Screenshot saved to bout_table_screenshot.png');
  } else {
    console.log('❌ Bout table section not found');
  }

  // Check computed styles
  const styles = await page.evaluate(() => {
    const table = document.querySelector('.bouts-table');
    const row = document.querySelector('.bout-row');
    const cell = document.querySelector('.bouts-table td');
    
    if (!table) return { error: 'Table not found' };
    
    return {
      table: {
        display: getComputedStyle(table).display,
        width: getComputedStyle(table).width,
        borderCollapse: getComputedStyle(table).borderCollapse,
        marginTop: getComputedStyle(table).marginTop
      },
      row: row ? {
        borderBottom: getComputedStyle(row).borderBottom,
        backgroundColor: getComputedStyle(row).backgroundColor,
        transition: getComputedStyle(row).transition
      } : { error: 'No rows found' },
      cell: cell ? {
        padding: getComputedStyle(cell).padding,
        fontSize: getComputedStyle(cell).fontSize,
        verticalAlign: getComputedStyle(cell).verticalAlign
      } : { error: 'No cells found' }
    };
  });

  console.log('\n=== Bout Table Computed Styles ===');
  console.log(JSON.stringify(styles, null, 2));

  await context.close();
  await browser.close();
  server.close();
})();
