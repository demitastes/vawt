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

  const mergedDistilleries = tournamentData.entrants.map((entrant) => {
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

  mergedDistilleries.forEach((item) => {
    for (let index = 0; index < item.bouts.length; index += 1) {
      const { bout } = item.bouts[index];
      if (!bout || !isBoutWinner(item, bout)) continue;

      const target = targetFor(bout.round, bout.bout);
      if (!target) continue;

      const targetKey = `r${target.round}b${target.bout}`;
      if (item.bouts.some((entry) => entry.boutKey === targetKey)) continue;

      item.bouts.push({
        boutKey: targetKey,
        bout: boutByKey.get(targetKey)
      });
    }
  });

  return mergedDistilleries;
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


function isBoutActive(boutInfo) {
  if (!boutInfo || !boutInfo.dateRange) return false;
  const now = new Date();
  const startDate = new Date(boutInfo.dateRange.start + "T00:00:00-04:00");
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

function formatDateRange(dateRangeStr) {
  if (!dateRangeStr) return "";
  return dateRangeStr.replace(/(\d)-([A-Z])/g, '$1–$2');
}

function targetFor(round, bout) {
  if (round >= 5) return null;

  if (round === 4) {
    return { round: 5, bout: 1 };
  }

  const sideIndex = Math.ceil(bout / 2);
  const nextSideIndex = Math.ceil(sideIndex / 2);
  const nextBout = bout % 2 === 1 ? (nextSideIndex * 2) - 1 : nextSideIndex * 2;
  return { round: round + 1, bout: nextBout };
}

function organizerWinnerFor(boutInfo) {
  if (!boutInfo) return "";
  const winner = boutInfo.organizerWinner || boutInfo.winner || boutInfo.result;
  if (typeof winner === "string") return winner;
  if (winner && typeof winner.winner === "string") return winner.winner;
  return "";
}

function normalizedName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(co|company|distilling|distillery|llc|inc)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isBoutWinner(item, boutInfo) {
  const winner = normalizedName(organizerWinnerFor(boutInfo));
  if (!winner) return false;

  return [item.name, item.officialName, item.fullName]
    .filter(Boolean)
    .map(normalizedName)
    .some((name) => name === winner || name.startsWith(`${winner} `) || winner.startsWith(`${name} `));
}

function renderBoutLinks(boutInfo) {
  const placeholder = '<span class="bout-links-placeholder">&nbsp;</span>';
  if (!boutInfo || !boutInfo.links) {
    return {
      labelHtml: placeholder,
      linksHtml: placeholder
    };
  }

  const links = boutInfo.links;
  const linkConfigs = [
    { key: "instagram", label: "Instagram", abbr: "IG", title: "Vote on Instagram" },
    { key: "youtube", label: "YouTube", abbr: "YT", title: "Vote on YouTube" },
    { key: "twitter", label: "Twitter/X", abbr: "X", title: "Vote on Twitter/X" },
    { key: "discord", label: "Discord", abbr: "DC", title: "Join Discord" }
  ];

  const linkElements = linkConfigs
    .filter(({ key }) => links[key])
    .map(({ key, label, abbr, title }) => {
      return `<a class="voting-link" data-abbr="${escapeHtml(abbr)}" href="${escapeHtml(links[key])}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(title)}">${escapeHtml(label)}</a>`;
    });

  return linkElements.length
    ? {
        labelHtml: "Vote",
        linksHtml: linkElements.join(" • ")
      }
    : {
        labelHtml: placeholder,
        linksHtml: placeholder
      };
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

  const badges = SPIRIT_TYPES.ALL.map(type => {
    const hasType = type === "other"
      ? Array.from(producedTypes).some(t => !SPIRIT_TYPES.KNOWN.includes(t))
      : producedTypes.has(type);

    const label = hasType ? "yes" : "no";
    const displayLabel = SPIRIT_TYPES.LABELS_SHORT[type] || SPIRIT_TYPES.LABELS[type] || type;

    return `<span class="spirit-badge ${label}">${escapeHtml(displayLabel)}: ${label}</span>`;
  }).join("\n          ");

  return badges;
}

function getProductTypesForIndex(products) {
  if (!products || products.length === 0) {
    return "Research pending";
  }

  const producedTypes = new Set(products.map(p => p.type?.toLowerCase()));
  const displayTypes = SPIRIT_TYPES.ALL
    .filter(type => type !== "other" && producedTypes.has(type))
    .map(type => SPIRIT_TYPES.LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1));

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
      const { labelHtml, linksHtml } = renderBoutLinks(bout);
      const rowClass = isActive ? " is-active" : "";
      const indicator = isActive
        ? '<span class="bout-active-indicator" aria-label="This bout is currently active"></span>'
        : '<span class="bout-label-spacer"></span>';

      return `
          <tr class="bout-row${rowClass}">
            <td class="bout-indicator-cell">${indicator}</td>
            <td class="bout-label">${escapeHtml(boutKey.toUpperCase())}</td>
            <td class="bout-dates">${escapeHtml(dateStr)}</td>
            <td class="bout-vote-label">${labelHtml}</td>
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
  <link rel="stylesheet" href="../distillery-common.css">
  <link rel="stylesheet" href="../distillery-profile.css">
</head>
<body>
  <main class="page">
    <a class="crumb" href="./index.html">Back to distillery profiles</a>

    <header class="hero">
      <h1>${escapeHtml(sourceName(item))}</h1>
      <p class="subtitle">VAWT 2026 entrant #${index + 1} - ${escapeHtml(item.bout)} - ${escapeHtml(formatDateRange(item.dateRange))}</p>
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
          <dd>${escapeHtml(formatDateRange(item.dateRange))}</dd>
          <dt>Location</dt>
          <dd>${escapeHtml(locationLabel(item))}</dd>
        </dl>

        <h3 style="margin: 20px 0 0; padding-top: 20px; border-top: 1px solid var(--border); font-size: 18px; line-height: 1.2; letter-spacing: 0;">Spirit types</h3>
        <div class="spirit-types" style="margin-top: 12px;">
          ${getSpiritTypeSummary(item.products)}
        </div>
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
    const isActive = item.bouts && item.bouts.some(({ bout }) => isBoutActive(bout));
    const activeClass = isActive ? " is-active" : "";
    const activeIndicator = isActive
      ? '<span class="bout-active-indicator" aria-label="This bout is currently voting"></span>'
      : '<span class="bout-label-spacer"></span>';
    return `
      <tr class="distillery-row${activeClass}">
        <td class="distillery-indicator-cell">${activeIndicator}</td>
        <td>${index + 1}</td>
        <td><a href="./${slug}.html">${escapeHtml(title)}</a></td>
        <td>${escapeHtml(item.bout)}</td>
        <td>${escapeHtml(formatDateRange(item.dateRange))}</td>
        <td>${escapeHtml(productTypes)}</td>
      </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VAWT Distillery Profiles</title>
  <link rel="stylesheet" href="../distillery-common.css">
  <link rel="stylesheet" href="../distillery-index.css">
</head>
<body>
  <main class="page">
    <a class="crumb" href="../index.html">Back to bracket</a>
    <header class="hero">
      <h1>VAWT Distillery Profiles</h1>
      <p class="subtitle">Distillery profiles for the 2026 Virginia Whiskey Tournament, ordered by first appearance in the voting schedule.</p>
    </header>

    <section>
      <h2>Profiles</h2>
      <p>Each page contains links to official website, Instagram, and Facebook, an "about the distillery" summary, a list of products, whiskey and spirits categories the distillery produces, and source-backed summary copy.</p>
      <table>
        <thead>
        <tr>
          <th></th>
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
