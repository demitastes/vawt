#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "distilleries");
const DISTILLERY_DATA_PATH = path.join(ROOT, "data", "distillery-data.json");
const TOURNAMENT_DATA_PATH = path.join(ROOT, "data", "tournament-data.json");
const BOUT_DATA_PATH = path.join(ROOT, "data", "bout-data.json");
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

// Spirit types configuration: all types, display order, and labels
const SPIRIT_TYPES = {
  ALL: ["bourbon", "rye", "asmw", "other whiskey", "flavored whiskey", "moonshine", "vodka", "gin", "rum", "brandy", "agave", "liqueur", "other"],
  KNOWN: ["bourbon", "rye", "asmw", "other whiskey", "flavored whiskey", "moonshine", "vodka", "gin", "rum", "brandy", "agave", "liqueur"],
  LABELS: {
    "bourbon": "Bourbon",
    "rye": "Rye",
    "asmw": "American Single Malt Whiskey",
    "other whiskey": "Other Whiskey",
    "flavored whiskey": "Flavored Whiskey",
    "moonshine": "Moonshine",
    "vodka": "Vodka",
    "gin": "Gin",
    "rum": "Rum",
    "brandy": "Brandy",
    "agave": "Agave",
    "liqueur": "Liqueur",
    "other": "Other"
  },
  LABELS_SHORT: {
    "asmw": "ASMW"
  }
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadDistilleries() {
  const distilleryRecords = loadJson(DISTILLERY_DATA_PATH);
  const tournamentData = loadJson(TOURNAMENT_DATA_PATH);
  const boutDataArray = loadJson(BOUT_DATA_PATH);
  const distilleryByName = new Map(distilleryRecords.map((record) => [record.name, record]));
  const boutByKey = new Map(
    boutDataArray.map((bout) => [`r${bout.round}b${bout.bout}`, bout])
  );

  // Build a map of distillery name -> array of bouts they're in
  const distilleryBouts = new Map();
  tournamentData.entrants.forEach((entrant) => {
    const boutKey = entrant.bout.toLowerCase().replace(/\s+/g, "");
    if (!distilleryBouts.has(entrant.name)) {
      distilleryBouts.set(entrant.name, []);
    }
    const boutInfo = boutByKey.get(boutKey);
    distilleryBouts.get(entrant.name).push({
      boutKey,
      bout: boutInfo
    });
  });

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
      website: distillery.website,
      instagram: distillery.instagram,
      facebook: distillery.facebook,
      summary: distillery.summary || "",
      summarySourceLink: distillery["summary-source-link"] || "",
      products: distillery.products || [],
      bout: entrant.bout,
      dateRange: entrant.dateRange,
      notes: entrant.notes,
      productHints: entrant.productHints,
      bouts: distilleryBouts.get(entrant.name) || []
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

function renderSocialLinks(item) {
  const links = [];

  const website = item.website;
  if (website === undefined) {
    links.push(`<span class="link-button is-placeholder">Official website: TODO</span>`);
  } else if (website && website.trim()) {
    links.push(`<a class="link-button" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Official website</a>`);
  }

  const instagram = item.instagram;
  if (instagram === undefined) {
    links.push(`<span class="link-button is-placeholder">Instagram: TODO</span>`);
  } else if (instagram && instagram.trim()) {
    links.push(`<a class="link-button" href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>`);
  }

  const facebook = item.facebook;
  if (facebook === undefined) {
    links.push(`<span class="link-button is-placeholder">Facebook: TODO</span>`);
  } else if (facebook && facebook.trim()) {
    links.push(`<a class="link-button" href="${escapeHtml(facebook)}" target="_blank" rel="noopener noreferrer">Facebook</a>`);
  }

  return links.join("\n        ");
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

    .bouts-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    .bout-row {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.2s ease;
      height: 40px;
    }

    .bout-row:hover {
      background-color: var(--panel-strong);
    }

    .bout-row.is-active {
      background-color: #f0fdf4;
    }

    .bout-row.is-active:hover {
      background-color: #e8fbea;
    }

    .bouts-table td {
      padding: 0 12px;
      font-size: 14px;
      vertical-align: middle;
      height: 40px;
    }

    .bout-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      color: var(--accent);
      width: 80px;
      height: 40px;
    }

    .bout-label-spacer {
      width: 8px;
      height: 8px;
      flex-shrink: 0;
    }

    .bout-row.is-active .bout-label {
      color: #2d8e2d;
    }

    .bout-dates {
      color: var(--muted);
      width: 140px;
      font-size: 13px;
    }

    .bout-row.is-active .bout-dates {
      color: #3da53d;
      font-weight: 600;
    }

    .bout-links {
      font-size: 12px;
      min-height: 16px;
    }

    .bout-links-placeholder {
      display: inline-block;
      min-width: 1px;
    }

    .bout-active-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2d8e2d;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px #fff, 0 0 0 3px #2d8e2d;
    }

    .voting-link {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: var(--accent-soft);
      color: var(--accent);
      text-decoration: none;
      font-weight: 700;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .voting-link:hover {
      background-color: var(--accent);
      color: #fffdf9;
    }

    .bout-row.is-active .voting-link {
      background-color: #c1e9c1;
      color: #2d8e2d;
    }

    .bout-row.is-active .voting-link:hover {
      background-color: #2d8e2d;
      color: #fff;
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

      .bouts-table,
      .bouts-table tbody,
      .bouts-table tr,
      .bouts-table td {
        display: block;
        width: 100%;
      }

      .bout-row {
        padding: 12px 0;
        border: 0;
        border-bottom: 1px solid var(--border);
        display: grid;
        gap: 4px;
      }

      .bouts-table td {
        padding: 2px 0;
        display: block;
        width: 100%;
        font-size: 13px;
      }

      .bout-label {
        width: 100%;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .bout-dates {
        width: 100%;
      }

      .bout-links {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }

      .voting-link {
        font-size: 11px;
        padding: 3px 6px;
      }
    }
  `;
}

function isBoutActive(boutInfo) {
  if (!boutInfo || !boutInfo.dateRange) return false;
  const now = new Date();
  const startDate = new Date(boutInfo.dateRange.start + "T12:00:00-04:00");
  const endDate = new Date(boutInfo.dateRange.end + "T23:59:59-04:00");
  return now >= startDate && now <= endDate;
}

function formatBoutDate(boutInfo) {
  if (!boutInfo || !boutInfo.dateRange) return "";
  const fmt = { month: "short", day: "numeric", timeZone: "UTC" };
  const start = new Date(boutInfo.dateRange.start).toLocaleDateString("en-US", fmt);
  const end = new Date(boutInfo.dateRange.end).toLocaleDateString("en-US", fmt);
  return `${start} – ${end}`;
}

function renderBoutLinks(boutInfo) {
  if (!boutInfo || !boutInfo.links) return '<span class="bout-links-placeholder">&nbsp;</span>';
  const links = boutInfo.links;
  const linkConfigs = [
    { key: "instagram", label: "Instagram", title: "Vote on Instagram" },
    { key: "youtube", label: "YouTube", title: "Vote on YouTube" },
    { key: "twitter", label: "Twitter/X", title: "Vote on Twitter/X" },
    { key: "discord", label: "Discord", title: "Join Discord" }
  ];

  const linkElements = linkConfigs
    .filter(({ key }) => links[key])
    .map(({ key, label, title }) => {
      return `<a class="voting-link" href="${escapeHtml(links[key])}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(title)}">${escapeHtml(label)}</a>`;
    });

  return linkElements.length ? `Voting links: ${linkElements.join(" • ")}` : '<span class="bout-links-placeholder">&nbsp;</span>';
}

function renderProductPortfolio(products) {
  if (!products || products.length === 0) {
    return `<section>
          <h2>Product Portfolio</h2>
          <p class="todo">TODO: Add products from official sources.</p>
        </section>`;
  }

  const productsByType = {};

  SPIRIT_TYPES.ALL.forEach(type => {
    productsByType[type] = [];
  });

  products.forEach(product => {
    const type = product.type?.toLowerCase() || "other";
    if (!productsByType[type]) {
      productsByType[type] = [];
    }
    productsByType[type].push(product);
  });

  const productSections = SPIRIT_TYPES.ALL
    .filter(type => productsByType[type].length > 0)
    .map(type => {
      const items = productsByType[type].map(product => {
        let itemHtml = "";
        if (product.link && product.link.trim()) {
          itemHtml = `<a href="${escapeHtml(product.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.name)}</a>`;
        } else {
          itemHtml = escapeHtml(product.name);
        }

        if (product.price) {
          itemHtml += ` — ${escapeHtml(product.price)}`;
        }

        return `<li>${itemHtml}</li>`;
      }).join("\n");

      const label = SPIRIT_TYPES.LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
      return `<h3>${escapeHtml(label)}</h3>\n          <ul>\n${items}\n          </ul>`;
    })
    .join("\n\n          ");

  return `<section>
          <h2>Product Portfolio</h2>
          ${productSections}
        </section>`;
}

function getSpiritTypeSummary(products) {
  const producedTypes = new Set((products || []).map(p => p.type?.toLowerCase()));

  return SPIRIT_TYPES.ALL.map(type => {
    const hasType = type === "other"
      ? Array.from(producedTypes).some(t => !SPIRIT_TYPES.KNOWN.includes(t))
      : producedTypes.has(type);

    const color = hasType ? "#059669" : "#dc2626";
    const label = hasType ? "yes" : "no";
    const badgeStyle = `display: inline-block; padding: 4px 8px; border: 1.5px solid ${color}; border-radius: 4px; color: ${color}; font-weight: 700; font-size: 12px;`;
    const displayLabel = SPIRIT_TYPES.LABELS_SHORT[type] || SPIRIT_TYPES.LABELS[type] || type;

    return `<dt>${escapeHtml(displayLabel)}</dt>\n          <dd><span style="${badgeStyle}">${label}</span></dd>`;
  }).join("\n          ");
}

function getProductTypesForIndex(products) {
  if (!products || products.length === 0) {
    return "Research pending";
  }

  const producedTypes = new Set(products.map(p => p.type?.toLowerCase()));
  const displayTypes = Array.from(producedTypes)
    .filter(type => type && type !== "other")
    .map(type => SPIRIT_TYPES.LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1))
    .sort();

  if (producedTypes.has("other") || Array.from(producedTypes).some(t => !SPIRIT_TYPES.KNOWN.includes(t))) {
    displayTypes.push("Other");
  }

  return displayTypes.length > 0 ? displayTypes.join(", ") : "Research pending";
}

function renderSummarySection(item, title) {
  if (!item.summary || !item.summary.trim()) {
    return `<section>
          <h2>Summary</h2>
          <p class="todo">TODO: Add a source-backed, Wikipedia-style summary of ${escapeHtml(title)} covering its story, production philosophy, and product portfolio construction.</p>
        </section>`;
  }

  const sourceLink = item.summarySourceLink && item.summarySourceLink.trim()
    ? `<p style="margin: 12px 0 0; font-size: 13px;"><a href="${escapeHtml(item.summarySourceLink)}" target="_blank" rel="noopener noreferrer" style="color: var(--muted);">Source →</a></p>`
    : "";

  return `<section>
          <h2>Summary</h2>
          <p>${item.summary}</p>
          ${sourceLink}
        </section>`;
}

function renderBoutList(item) {
  if (!item.bouts || item.bouts.length === 0) {
    return "";
  }

  const boutRows = item.bouts
    .map(({ boutKey, bout }) => {
      const isActive = isBoutActive(bout);
      const dateStr = formatBoutDate(bout);
      const linksHtml = renderBoutLinks(bout);
      const activeClass = isActive ? " is-active" : "";
      const indicatorOrSpacer = isActive
        ? '<span class="bout-active-indicator" aria-label="This bout is currently active"></span>'
        : '<span class="bout-label-spacer"></span>';

      return `
          <tr class="bout-row${activeClass}">
            <td class="bout-label">${indicatorOrSpacer}${escapeHtml(boutKey.toUpperCase())}</td>
            <td class="bout-dates">${escapeHtml(dateStr)}</td>
            <td class="bout-links">${linksHtml}</td>
          </tr>`;
    })
    .join("\n");

  return `
        <section>
          <h2>Tournament Bouts</h2>
          <table class="bouts-table">
            <tbody>${boutRows}
            </tbody>
          </table>
        </section>`;
}

function renderStubPage(item, index) {
  const title = pageTitle(item);
  const hints = item.productHints || [];
  const notes = item.notes || [];
  const slug = slugify(title);
  const locationEmbeds = renderLocationEmbeds(item);
  const boutList = renderBoutList(item);
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
        ${renderSocialLinks(item)}
      </nav>
    </header>

    <div class="grid">
      <div>
        ${renderSummarySection(item, title)}

${boutList}

${renderProductPortfolio(item.products)}

${locationEmbeds}
        <section>
          <h2>Sources</h2>
          <ul class="source-list">
            ${item.website && item.website.trim() ? `<li>Official website: <a href="${escapeHtml(item.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.website)}</a></li>` : '<li>TODO: Official website source URL.</li>'}
            ${item.instagram && item.instagram.trim() ? `<li>Instagram: <a href="${escapeHtml(item.instagram)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.instagram)}</a></li>` : '<li>TODO: Official Instagram source URL.</li>'}
            ${item.facebook && item.facebook.trim() ? `<li>Facebook: <a href="${escapeHtml(item.facebook)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.facebook)}</a></li>` : ''}
            <li>Location/address references: <a href="https://virginiaspirits.org/distilleries/" target="_blank" rel="noopener noreferrer">Virginia Spirits distillery directory</a>, plus official or local tourism pages where the directory did not list the entrant.</li>
          </ul>
        </section>
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
        </dl>

        <h3 style="margin: 20px 0 0; padding-top: 20px; border-top: 1px solid var(--border); font-size: 18px; line-height: 1.2; letter-spacing: 0;">Spirit types</h3>
        <dl style="margin-top: 12px;">
          ${getSpiritTypeSummary(item.products)}
        </dl>
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
    const productTypes = getProductTypesForIndex(item.products);
    return `
      <tr>
        <td>${index + 1}</td>
        <td><a href="./${slug}.html">${escapeHtml(title)}</a></td>
        <td>${escapeHtml(item.bout)}</td>
        <td>${escapeHtml(item.dateRange)}</td>
        <td>${escapeHtml(productTypes)}</td>
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
      table-layout: auto;
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

    th:nth-child(1),
    td:nth-child(1) {
      width: 40px;
      text-align: center;
      white-space: nowrap;
    }

    th:nth-child(2),
    td:nth-child(2) {
      width: 0;
      min-width: 150px;
    }

    th:nth-child(3),
    td:nth-child(3) {
      width: 60px;
      white-space: nowrap;
    }

    th:nth-child(4),
    td:nth-child(4) {
      width: 140px;
      white-space: nowrap;
    }

    th:nth-child(5),
    td:nth-child(5) {
      width: 0;
      min-width: 200px;
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
            <th>Product types</th>
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
