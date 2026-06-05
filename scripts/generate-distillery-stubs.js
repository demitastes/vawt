#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "distilleries");
const DISTILLERY_DATA_PATH = path.join(ROOT, "data", "distillery-data.json");
const TOURNAMENT_DATA_PATH = path.join(ROOT, "data", "tournament-data.json");
const dryRun = process.argv.includes("--dry-run");

// Distilleries whose profile page title uses officialName rather than short name.
const OFFICIAL_NAME_PAGE_TITLES = new Set([
  "New Realm",
  "Highlands Distilling",
  "Springfield Distillery",
  "Mean Spirits",
  "Reservoir",
  "Virginia Distillery Co",
  "Spirit Lab",
  "Bon Durant Brothers",
  "Twin Creeks",
  "GW's Grist Mill",
  "Blue Shepherd",
  "Caiseal",
  "Bold Rock",
  "Three Wives",
  "Davis Valley",
  "Filibuster",
  "Mt Defiance",
  "Catoctin Creek",
  "Virginia Foothills",
  "Appalachian Heritage",
  "Sandy River",
  "Belmont Farm",
  "Three Notches",
  "Lincoln Ridge",
  "Hilltop",
  "Franklin County",
  "Axe Handle"
]);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadDistilleries() {
  const distilleryRecords = loadJson(DISTILLERY_DATA_PATH);
  const tournamentData = loadJson(TOURNAMENT_DATA_PATH);
  const distilleryByName = new Map(distilleryRecords.map((record) => [record.name, record]));

  return tournamentData.entrants.map((entrant) => {
    const distillery = distilleryByName.get(entrant.name);

    if (!distillery) {
      throw new Error(
        `No distillery-data.json entry for tournament entrant "${entrant.name}". ` +
          "Use the canonical name from distillery-data.json in tournament-data.json."
      );
    }

    const merged = {
      name: distillery.name,
      officialName: distillery.officialName,
      locations: distillery.locations,
      bout: entrant.bout,
      dateRange: entrant.dateRange,
      notes: entrant.notes,
      productHints: entrant.productHints
    };

    if (
      OFFICIAL_NAME_PAGE_TITLES.has(distillery.name) &&
      distillery.officialName &&
      distillery.officialName !== distillery.name
    ) {
      merged.fullName = distillery.officialName;
    }

    return merged;
  });
}

const distilleries = loadDistilleries();

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageTitle(item) {
  return item.fullName || item.name;
}

function sourceName(item) {
  return item.officialName || item.name;
}

function locationLabel(item) {
  const locations = item.locations || [];

  if (locations.length === 0) {
    return "TODO: Ask user or verify from official source.";
  }

  if (locations.length === 1) {
    return locations[0];
  }

  return `${locations.length} known locations`;
}

function mapQueryFor(item, location) {
  return `${sourceName(item)} ${location}`;
}

function mapUrlFor(item, location) {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQueryFor(item, location))}`;
}

function mapEmbedUrlFor(item, location) {
  return `${mapUrlFor(item, location)}&output=embed`;
}

function renderLocationEmbeds(item) {
  const locations = item.locations || [];

  if (locations.length === 0) {
    return "";
  }

  const embeds = locations.map((location, index) => {
    const title = locations.length === 1 ? "Location Map" : `Location Map ${index + 1}`;
    const mapUrl = mapUrlFor(item, location);
    const embedUrl = mapEmbedUrlFor(item, location);

    return `
          <div class="map-card">
            <p class="map-address">${escapeHtml(location)}</p>
            <iframe
              class="map-frame"
              title="${escapeHtml(title)} for ${escapeHtml(pageTitle(item))}"
              src="${escapeHtml(embedUrl)}"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen></iframe>
            <a class="map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">View larger map</a>
          </div>`;
  }).join("\n");

  return `
        <section class="location-section" aria-labelledby="location-map-heading">
          <h2 id="location-map-heading">Location Map</h2>
          <div class="map-list">${embeds}
          </div>
        </section>
`;
}

function renderCss() {
  return `
    :root {
      --bg: #f6f1e8;
      --ink: #201a17;
      --muted: #6e625b;
      --line: #a66c3b;
      --panel: #fffdf9;
      --panel-strong: #fff6df;
      --accent: #8e431d;
      --accent-soft: #f4dfc3;
      --border: #d7b992;
      --shadow: 0 12px 30px rgba(63, 36, 18, 0.12);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--ink);
      background:
        linear-gradient(180deg, rgba(255, 253, 249, 0.9), rgba(246, 241, 232, 0.98)),
        radial-gradient(circle at top left, rgba(166, 108, 59, 0.18), transparent 30rem);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
    }

    a { color: var(--accent); }

    .page {
      width: min(1080px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 44px;
    }

    .crumb {
      display: inline-block;
      margin-bottom: 18px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
    }

    .hero {
      padding: 30px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    h1 {
      margin: 0;
      font-size: clamp(32px, 5vw, 54px);
      line-height: 1;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 15px;
    }

    .top-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }

    .link-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 10px 14px;
      border: 1px solid var(--accent);
      border-radius: 6px;
      background: var(--accent);
      color: #fffdf9;
      font-weight: 800;
      text-decoration: none;
    }

    .link-button.is-placeholder {
      border-color: var(--border);
      background: var(--accent-soft);
      color: var(--accent);
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 20px;
      margin-top: 20px;
    }

    section,
    aside {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
      padding: 20px;
    }

    section + section { margin-top: 20px; }

    h2 {
      margin: 0 0 12px;
      font-size: 18px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    p { margin: 0 0 12px; }
    p:last-child { margin-bottom: 0; }

    dl {
      display: grid;
      grid-template-columns: 110px minmax(0, 1fr);
      gap: 8px 12px;
      margin: 0;
      font-size: 14px;
    }

    dt {
      color: var(--muted);
      font-weight: 800;
    }

    dd { margin: 0; }

    ul {
      margin: 0;
      padding-left: 18px;
    }

    li + li { margin-top: 6px; }

    .todo {
      border-left: 4px solid var(--line);
      background: var(--panel-strong);
      padding: 12px;
      color: var(--ink);
      font-size: 14px;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0;
      list-style: none;
    }

    .tag-list li {
      margin: 0;
      padding: 6px 9px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--panel-strong);
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
    }

    .source-list {
      font-size: 13px;
    }

    .location-section {
      margin-top: 20px;
    }

    .map-list {
      display: grid;
      gap: 16px;
    }

    .map-card {
      display: grid;
      gap: 10px;
    }

    .map-address {
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }

    .map-frame {
      display: block;
      width: 100%;
      height: 260px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--panel-strong);
    }

    .map-link {
      font-size: 13px;
      font-weight: 800;
    }

    @media (max-width: 760px) {
      .page {
        width: min(100% - 24px, 1080px);
        padding-top: 16px;
      }

      .hero,
      section,
      aside {
        padding: 16px;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      dl {
        grid-template-columns: 1fr;
      }

      .map-frame {
        height: 220px;
      }
    }
  `;
}

function renderStubPage(item, index) {
  const title = pageTitle(item);
  const hints = item.productHints || [];
  const notes = item.notes || [];
  const slug = slugify(title);
  const locationEmbeds = renderLocationEmbeds(item);
  const hintItems = hints.length
    ? hints.map((hint) => `<li>${escapeHtml(hint)}</li>`).join("\n")
    : "<li>TODO: Confirm product categories.</li>";
  const noteItems = notes.length
    ? notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("\n")
    : "<li>No extra tournament notes recorded yet.</li>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - VAWT Distillery Profile</title>
  <style>${renderCss()}</style>
</head>
<body>
  <main class="page">
    <a class="crumb" href="./index.html">Back to distillery profiles</a>

    <header class="hero">
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">VAWT 2026 entrant #${index + 1} - ${escapeHtml(item.bout)} - ${escapeHtml(item.dateRange)}</p>
      <nav class="top-links" aria-label="Official links">
        <span class="link-button is-placeholder">Official website: TODO</span>
        <span class="link-button is-placeholder">Instagram: TODO</span>
      </nav>
    </header>

    <div class="grid">
      <div>
        <section>
          <h2>Summary</h2>
          <p class="todo">TODO: Add a source-backed, Wikipedia-style summary of ${escapeHtml(title)} covering its story, production philosophy, and product portfolio construction.</p>
        </section>

        <section>
          <h2>Product Portfolio</h2>
          <p class="todo">TODO: Verify all current products from official sources. Link each product to its official product page when one exists.</p>
          <h3>Known or bracket-supplied product hints</h3>
          <ul>${hintItems}</ul>
          <h3>Whiskey categories to verify</h3>
          <ul>
            <li>Bourbon: TODO</li>
            <li>Rye: TODO</li>
            <li>American single malt: TODO</li>
            <li>Other American whiskey / corn / wheat / finished whiskey: TODO</li>
            <li>Non-whiskey spirits: TODO</li>
          </ul>
        </section>

        <section>
          <h2>Sources</h2>
          <ul class="source-list">
            <li>TODO: Official website source URL.</li>
            <li>TODO: Official Instagram source URL.</li>
            <li>TODO: Product page source URLs.</li>
            <li>Location/address references: <a href="https://virginiaspirits.org/distilleries/" target="_blank" rel="noopener noreferrer">Virginia Spirits distillery directory</a>, plus official or local tourism pages where the directory did not list the entrant.</li>
          </ul>
        </section>
${locationEmbeds}
      </div>

      <aside>
        <h2>Snapshot</h2>
        <dl>
          <dt>Short name</dt>
          <dd>${escapeHtml(item.name)}</dd>
          <dt>Official name</dt>
          <dd>${escapeHtml(sourceName(item))}</dd>
          <dt>Bout</dt>
          <dd>${escapeHtml(item.bout)}</dd>
          <dt>Voting window</dt>
          <dd>${escapeHtml(item.dateRange)}</dd>
          <dt>Location</dt>
          <dd>${escapeHtml(locationLabel(item))}</dd>
          <dt>Main product type</dt>
          <dd>TODO: Verify from official source.</dd>
        </dl>

        <h2 style="margin-top: 22px;">Tournament Notes</h2>
        <ul>${noteItems}</ul>
      </aside>
    </div>
  </main>
</body>
</html>
`;
}

function renderIndex() {
  const rows = distilleries.map((item, index) => {
    const title = pageTitle(item);
    const slug = slugify(title);
    const hints = item.productHints && item.productHints.length ? item.productHints.join(", ") : "Research pending";
    return `
      <tr>
        <td>${index + 1}</td>
        <td><a href="./${slug}.html">${escapeHtml(title)}</a></td>
        <td>${escapeHtml(item.bout)}</td>
        <td>${escapeHtml(item.dateRange)}</td>
        <td>${escapeHtml(hints)}</td>
      </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VAWT Distillery Profiles</title>
  <style>${renderCss()}
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      overflow-wrap: anywhere;
    }

    th,
    td {
      padding: 10px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
    }

    @media (max-width: 760px) {
      table,
      thead,
      tbody,
      tr,
      th,
      td {
        display: block;
      }

      thead { display: none; }

      tr {
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 4px 0;
        border: 0;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <a class="crumb" href="../index.html">Back to bracket</a>
    <header class="hero">
      <h1>VAWT Distillery Profiles</h1>
      <p class="subtitle">Static profile stubs for the 2026 tournament, ordered by first appearance in the voting schedule.</p>
    </header>

    <section>
      <h2>Profiles</h2>
      <p>Each page currently contains structured placeholders for official website, Instagram, products, whiskey categories, and source-backed summary copy.</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Distillery</th>
            <th>Bout</th>
            <th>Voting window</th>
            <th>Known product hints</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>
`;
}

if (dryRun) {
  console.log(`Would generate ${distilleries.length} distillery profile stubs in ${path.relative(ROOT, OUTPUT_DIR)}/`);
  process.exit(0);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const generatedProfileFiles = new Set();

distilleries.forEach((item, index) => {
  const slug = slugify(pageTitle(item));
  const fileName = `${slug}.html`;
  generatedProfileFiles.add(fileName);
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), renderStubPage(item, index));
});

for (const fileName of fs.readdirSync(OUTPUT_DIR)) {
  if (fileName.endsWith(".html") && fileName !== "index.html" && !generatedProfileFiles.has(fileName)) {
    fs.unlinkSync(path.join(OUTPUT_DIR, fileName));
  }
}

fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), renderIndex());

console.log(`Generated ${distilleries.length} distillery profile stubs in ${path.relative(ROOT, OUTPUT_DIR)}/`);
