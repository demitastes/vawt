#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "distilleries");
const dryRun = process.argv.includes("--dry-run");

const distilleries = [
  { name: "Open Road", bout: "R1B1", dateRange: "May 30-Jun 5, 2026", locations: ["1871 Fountain Dr., Ste. 100, Reston, VA 20190"] },
  { name: "Brady's", bout: "R1B1", dateRange: "May 30-Jun 5, 2026", locations: ["711 Pocahontas Ave. NE, Roanoke, VA 24012"] },
  { name: "Old House", bout: "R1B1", dateRange: "May 30-Jun 5, 2026", locations: ["18351 Corkys Ln., Culpeper, VA 22791"] },
  { name: "Three Crosses", bout: "R1B1", dateRange: "May 30-Jun 5, 2026", locations: ["3835 Old Buckingham Rd., Powhatan, VA 23139"] },
  { name: "New Realm", fullName: "New Realm Brewing & Distilling", bout: "R1B2", dateRange: "May 30-Jun 5, 2026", locations: ["5941 Harbour View Blvd., Suffolk, VA 23435", "1209 Craft Ln., Virginia Beach, VA 23454"] },
  { name: "Lost Whiskey Co", bout: "R1B2", dateRange: "May 30-Jun 5, 2026", locations: ["2811 Merrilee Dr., Ste. D, Fairfax, VA 22031"] },
  { name: "Highlands", fullName: "Highlands Distilling Co", bout: "R1B2", dateRange: "May 30-Jun 5, 2026", locations: ["1200 VA-16, Marion, VA 24354"] },
  { name: "Springfield", fullName: "Springfield Distillery", bout: "R1B2", dateRange: "May 30-Jun 5, 2026", locations: ["9040 River Rd., Halifax, VA 24558"] },
  { name: "KO Distilling", bout: "R1B3", dateRange: "Jun 6-Jun 12, 2026", locations: ["10381 Central Park Dr., Ste. 105, Manassas, VA 20110"], notes: ["Tournament note: veteran-owned."] },
  { name: "Mean Spirits", fullName: "Mean Spirits Distilling", bout: "R1B3", dateRange: "Jun 6-Jun 12, 2026", locations: ["2401 Colonial Ave., Norfolk, VA 23517"], notes: ["Tournament note: veteran-owned."] },
  { name: "Reservoir", fullName: "Reservoir Distillery", bout: "R1B3", dateRange: "Jun 6-Jun 12, 2026", locations: ["1800A Summit Ave., Richmond, VA 23230"] },
  { name: "Deep Creek", bout: "R1B4", dateRange: "Jun 6-Jun 12, 2026", locations: ["801 Butler St., Ste. 12, Chesapeake, VA 23323"] },
  { name: "Five Mile Mountain", bout: "R1B4", dateRange: "Jun 6-Jun 12, 2026", locations: ["489 Floyd Hwy. S., Floyd, VA 24901"] },
  { name: "Ironclad", bout: "R1B4", dateRange: "Jun 6-Jun 12, 2026", locations: ["124 23rd St., Newport News, VA 23607"], notes: ["Tournament note: veteran-owned."] },
  { name: "River Hill", bout: "R1B5", dateRange: "Jun 13-Jun 19, 2026", locations: ["356 Ruffners Ferry Rd., Luray, VA 22835"] },
  { name: "Cape Charles", bout: "R1B5", dateRange: "Jun 13-Jun 19, 2026", locations: ["222 Mason Ave., Cape Charles, VA 23310"] },
  { name: "Virginia Distillery Co", fullName: "Virginia Distillery Co.", bout: "R1B5", dateRange: "Jun 13-Jun 19, 2026", locations: ["299 Eades Ln., Lovingston, VA 22949"] },
  { name: "Silverback", bout: "R1B6", dateRange: "Jun 13-Jun 19, 2026", locations: ["9374 Rockfish Valley Hwy., Afton, VA 22920"] },
  { name: "River City", bout: "R1B6", dateRange: "Jun 13-Jun 19, 2026", locations: ["305 W. Main St., Radford, VA 24141"] },
  { name: "Spirit Lab", fullName: "Spirit Lab Distilling", bout: "R1B6", dateRange: "Jun 13-Jun 19, 2026", locations: ["1503 6th St. SE, Charlottesville, VA 22902"] },
  { name: "Reverend Spirits", bout: "R1B7", dateRange: "Jun 20-Jun 26, 2026", locations: ["1120 W. Olney Rd., Norfolk, VA 23507"] },
  { name: "Bon Durant Brothers", fullName: "Bon Durant Brothers Distillery", bout: "R1B7", dateRange: "Jun 20-Jun 26, 2026", locations: ["9 E 3rd St., Chase City, VA 23924"], productHints: ["Moonshine", "Bourbon"] },
  { name: "Twin Creeks", fullName: "Twin Creeks Distillery", bout: "R1B7", dateRange: "Jun 20-Jun 26, 2026", locations: ["140 Franklin St., Rocky Mount, VA 24151"], productHints: ["Moonshine", "Bourbon"] },
  { name: "GW's Grist Mill", fullName: "George Washington's Grist Mill Distillery", bout: "R1B7", dateRange: "Jun 20-Jun 26, 2026", locations: ["5513 Mount Vernon Memorial Hwy., Alexandria, VA 22309"] },
  { name: "Ragged Branch", bout: "R1B8", dateRange: "Jun 20-Jun 26, 2026", locations: ["1015 Taylors Gap Rd., Charlottesville, VA 22903"] },
  { name: "Devil's Backbone", bout: "R1B8", dateRange: "Jun 20-Jun 26, 2026", locations: ["200 Crandall Run, Roseland, VA 22967"] },
  { name: "Tarnished Truth", bout: "R1B8", dateRange: "Jun 20-Jun 26, 2026", locations: ["4200 Atlantic Ave., Virginia Beach, VA 23451"] },
  { name: "Blue Sky", bout: "R1B8", dateRange: "Jun 20-Jun 26, 2026", locations: ["17466 Benns Church Blvd., Smithfield, VA 23430"], productHints: ["Triple Deuce", "Rum", "Flavored spirits"] },
  { name: "Blue Shepherd", fullName: "Blue Shepherd Spirits", bout: "R1B9", dateRange: "Jun 27-Jul 3, 2026", locations: ["622 W. Main St., Luray, VA 22835"], productHints: ["Gin", "Bourbon", "American single malt"] },
  { name: "Caiseal", fullName: "Caiseal (Vanguard)", bout: "R1B9", dateRange: "Jun 27-Jul 3, 2026", locations: ["504 N. King St., Hampton, VA 23669"] },
  { name: "Bold Rock", fullName: "Bold Rock Distillery", bout: "R1B9", dateRange: "Jun 27-Jul 3, 2026", locations: ["1020 Rockfish Valley Hwy., Ste. A, Nellysford, VA 22958"] },
  { name: "Three Wives", fullName: "Three Wives Distillery Winchester", bout: "R1B10", dateRange: "Jun 27-Jul 3, 2026", locations: ["933 Barley Ln., Winchester, VA 22602"] },
  { name: "Davis Valley", fullName: "Davis Valley Distillery", bout: "R1B10", dateRange: "Jun 27-Jul 3, 2026", locations: ["1167 Davis Valley Rd., Rural Retreat, VA 24368"] },
  { name: "Climax", bout: "R1B10", dateRange: "Jun 27-Jul 3, 2026", locations: ["13490 Cedar Run Rd., Culpeper, VA 22701"], notes: ["Tournament note: previous production in association with Belmont Farm."] },
  { name: "Filibuster", fullName: "Filibuster Distillery", bout: "R1B11", dateRange: "Jul 4-Jul 10, 2026", locations: ["80 Maurertown Mill Rd., Maurertown, VA 22644"] },
  { name: "A. Smith Bowman", bout: "R1B11", dateRange: "Jul 4-Jul 10, 2026", locations: ["1 Bowman Dr., Fredericksburg, VA 22408"] },
  { name: "Mt Defiance", fullName: "Mt Defiance Cidery & Distillery (Old Bolstead)", bout: "R1B11", dateRange: "Jul 4-Jul 10, 2026", locations: ["495 E. Washington St., Middleburg, VA 20117"] },
  { name: "Catoctin Creek", fullName: "Catoctin Creek Distilling Co.", bout: "R1B12", dateRange: "Jul 4-Jul 10, 2026", locations: ["120 W. Main St., Purcellville, VA 20132"] },
  { name: "Virginia Foothills", fullName: "Virginia Foothills Distillery", bout: "R1B12", dateRange: "Jul 4-Jul 10, 2026", locations: ["5361 Spotswood Tr., Barboursville, VA 22923"] },
  { name: "Copper Fox", bout: "R1B12", dateRange: "Jul 4-Jul 10, 2026", locations: ["9 River Ln., Sperryville, VA 22740", "901 Capitol Landing Rd., Williamsburg, VA 23185"] },
  { name: "Appalachian Heritage", fullName: "Appalachian Heritage Distillery", bout: "R1B13", dateRange: "Jul 11-Jul 17, 2026", locations: ["110 W. Laurel Ave., Damascus, VA 24236"], productHints: ["Moonshine"] },
  { name: "Sandy River", fullName: "Sandy River Distillery", bout: "R1B13", dateRange: "Jul 11-Jul 17, 2026", locations: ["147 Monroe Church Rd., Rice, VA 23966"], productHints: ["Bourbon", "High Bridge rye"], notes: ["Tournament note: aged craft bourbon and High Bridge rye."] },
  { name: "Belmont Farm", fullName: "Belmont Farm Distillery", bout: "R1B13", dateRange: "Jul 11-Jul 17, 2026", locations: ["13490 Cedar Run Rd., Culpeper, VA 22701"] },
  { name: "Creek Bottom", bout: "R1B14", dateRange: "Jul 11-Jul 17, 2026", locations: ["307 N. Meadow St., Galax, VA 24333"] },
  { name: "Cool Springs", bout: "R1B14", dateRange: "Jul 11-Jul 17, 2026", locations: ["37871 Nicewarner Ln., Lovettsville, VA 20180"] },
  { name: "Trial & Error", bout: "R1B14", dateRange: "Jul 11-Jul 17, 2026", locations: ["1606 W. Main St., Richmond, VA 23220"] },
  { name: "J.H. Bards", bout: "R1B14", dateRange: "Jul 11-Jul 17, 2026", locations: ["213 Draper Rd. SW, Blacksburg, VA 24060"], notes: ["Tournament note: this entry may need to move to R1B16."] },
  { name: "Murlarkey", bout: "R1B15", dateRange: "Jul 18-Jul 24, 2026", locations: ["9861 Discovery Blvd., Manassas, VA 20109"] },
  { name: "Three Notches", fullName: "Three Notches (Brewery & Distillery)", bout: "R1B15", dateRange: "Jul 18-Jul 24, 2026", locations: ["2461 Rockfish Valley Hwy., Nellysford, VA 22958"] },
  { name: "Lincoln Ridge", fullName: "Lincoln Ridge Distillery", bout: "R1B15", dateRange: "Jul 18-Jul 24, 2026", locations: ["2149 Reymet Rd., North Chesterfield, VA 23237"] },
  { name: "Hilltop", fullName: "Hilltop Distillery", bout: "R1B15", dateRange: "Jul 18-Jul 24, 2026", locations: ["2750 Maidens Loop, Maidens, VA 23102"] },
  { name: "Sleepy Fox", bout: "R1B16", dateRange: "Jul 18-Jul 24, 2026", locations: ["11670 Lakeridge Pkwy., Ashland, VA 23005"], notes: ["Tournament note: double-check whether this distillery is still in production."] },
  { name: "Bell Isle", bout: "R1B16", dateRange: "Jul 18-Jul 24, 2026", locations: ["615 Maury St., Richmond, VA 23224"] },
  { name: "Franklin County", fullName: "Franklin County Distillers", bout: "R1B16", dateRange: "Jul 18-Jul 24, 2026", locations: ["25156 Highway 220, Boones Mill, VA 24065"], notes: ["Tournament note: Franklin County is associated with moonshine heritage."] },
  { name: "Axe Handle", fullName: "Axe Handle Distilling", bout: "R1B16", dateRange: "Jul 18-Jul 24, 2026", locations: ["42236 Wilderness Rd., Pennington Gap, VA 24277"] }
];

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
  return item.fullName && item.fullName !== item.name ? item.fullName : item.name;
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

distilleries.forEach((item, index) => {
  const slug = slugify(pageTitle(item));
  fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), renderStubPage(item, index));
});

fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), renderIndex());

console.log(`Generated ${distilleries.length} distillery profile stubs in ${path.relative(ROOT, OUTPUT_DIR)}/`);
