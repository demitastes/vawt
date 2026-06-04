const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('./bracket.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only' });
const { window } = dom;

// Execute the script
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
window.eval(script);

// Check the rendered dates
setTimeout(() => {
  const dateDivs = window.document.querySelectorAll('.bout-date');
  console.log('Sample bout dates:');
  for (let i = 0; i < Math.min(5, dateDivs.length); i++) {
    console.log(dateDivs[i].textContent);
  }
  process.exit(0);
}, 100);
