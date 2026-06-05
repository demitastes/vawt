#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DISTILLERIES_DIR = path.join(ROOT, "distilleries");
const TODO_FILE = path.join(ROOT, "TODO.md");
const BRACKET_FILE = path.join(ROOT, "index.html");
const DISTILLERY_DATA_FILE = path.join(ROOT, "data", "distillery-data.json");

let failures = 0;

function check(condition, passMessage, failMessage) {
  if (condition) {
    console.log(`✅ ${passMessage}`);
  } else {
    failures += 1;
    console.log(`❌ ${failMessage}`);
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function loadDistilleryData() {
  try {
    const data = fs.readFileSync(DISTILLERY_DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load distillery data:", error.message);
    return [];
  }
}

function getDistilleryByName(name, distilleries) {
  // Check both short name and official name
  return distilleries.find((d) => d.name === name || d.officialName === name);
}

function hasWebsiteData(distillery) {
  return distillery && distillery.website && distillery.website.trim() !== "";
}

function hasInstagramData(distillery) {
  return distillery && distillery.instagram && distillery.instagram.trim() !== "";
}

function isWebsiteFieldDefined(distillery) {
  return distillery && distillery.hasOwnProperty("website");
}

function isInstagramFieldDefined(distillery) {
  return distillery && distillery.hasOwnProperty("instagram");
}

function decodeHtmlEntities(text) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'"
  };
  return text.replace(/&[a-z]+;/g, (match) => entities[match] || match);
}

console.log("=== Distillery Profile Stub Test Suite ===\n");

check(fileExists("docs/distillery-profile-pages/SKILL.md"), "Profile-page skill exists", "Missing docs/distillery-profile-pages/SKILL.md");
check(fileExists("scripts/generate-distillery-stubs.js"), "Profile stub generator exists", "Missing scripts/generate-distillery-stubs.js");
check(fileExists("distilleries/index.html"), "Distillery index exists", "Missing distilleries/index.html");

const profileFiles = fs.existsSync(DISTILLERIES_DIR)
  ? fs.readdirSync(DISTILLERIES_DIR).filter((file) => file.endsWith(".html") && file !== "index.html")
  : [];

check(profileFiles.length === 55, "Generated 55 distillery profile pages", `Expected 55 distillery profile pages, found ${profileFiles.length}`);

// Load distillery data for validation
const distilleryData = loadDistilleryData();

const requiredSnippets = [
  "<h2>Summary</h2>",
  "<h2>Product Portfolio</h2>",
  "<h2>Sources</h2>"
];

const forbiddenPublicSnippets = [
  "../data/",
  "../docs/",
  "../TODO.md",
  "BRACKET.md",
  "TODO.md",
  "Profile page skill",
  "Next-step plan"
];

profileFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(DISTILLERIES_DIR, file), "utf8");

  // Extract distillery name from the H1 tag in the HTML
  // This is more reliable than reconstructing from the filename
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const distilleryName = h1Match ? decodeHtmlEntities(h1Match[1]) : null;

  if (!distilleryName) {
    console.error(`${file}: Could not extract distillery name from H1 tag`);
    return;
  }

  const distillery = getDistilleryByName(distilleryName, distilleryData);

  // Extract only the top-links section for social media button checking
  // This avoids false positives from TODO items in the Sources section
  const topLinksMatch = html.match(/<nav[^>]*class="top-links"[^>]*>([\s\S]*?)<\/nav>/);
  const topLinksContent = topLinksMatch ? topLinksMatch[1] : "";

  // Check official website control based on data availability and field definition
  // If the field is not defined in distillery-data.json: expect placeholder
  // If the field is defined but has data: expect actual link
  // If the field is defined but empty: expect nothing (not rendered)
  if (!isWebsiteFieldDefined(distillery)) {
    // Field not defined at all - should have placeholder
    check(
      topLinksContent.includes("Official website: TODO") && topLinksContent.includes("is-placeholder"),
      `${file} includes official website placeholder (field undefined)`,
      `${file} missing official website placeholder (field undefined)`
    );
  } else if (hasWebsiteData(distillery)) {
    // Field defined with actual data - should have link
    check(
      topLinksContent.includes(">Official website</a>"),
      `${file} includes official website link`,
      `${file} missing official website link (has data)`
    );
  } else {
    // Field defined but empty - should not render anything
    check(
      !topLinksContent.includes("Official website"),
      `${file} correctly omits empty official website`,
      `${file} incorrectly shows official website when empty`
    );
  }

  // Check Instagram control based on data availability and field definition
  if (!isInstagramFieldDefined(distillery)) {
    // Field not defined at all - should have placeholder
    check(
      topLinksContent.includes("Instagram: TODO") && topLinksContent.includes("is-placeholder"),
      `${file} includes Instagram placeholder (field undefined)`,
      `${file} missing Instagram placeholder (field undefined)`
    );
  } else if (hasInstagramData(distillery)) {
    // Field defined with actual data - should have link
    check(
      topLinksContent.includes(">Instagram</a>"),
      `${file} includes Instagram link`,
      `${file} missing Instagram link (has data)`
    );
  } else {
    // Field defined but empty - should not render anything
    check(
      !topLinksContent.includes(">Instagram</a>") && !topLinksContent.includes("Instagram: TODO"),
      `${file} correctly omits empty Instagram`,
      `${file} incorrectly shows Instagram when empty`
    );
  }

  requiredSnippets.forEach((snippet) => {
    check(html.includes(snippet), `${file} includes ${snippet}`, `${file} missing ${snippet}`);
  });
  if (html.includes("<h2 id=\"location-map-heading\">Location Map</h2>")) {
    [
      "https://www.google.com/maps?q=",
      "&amp;output=embed",
      "View larger map"
    ].forEach((snippet) => {
      check(html.includes(snippet), `${file} map includes ${snippet}`, `${file} map missing ${snippet}`);
    });
  }
  forbiddenPublicSnippets.forEach((snippet) => {
    check(!html.includes(snippet), `${file} does not expose ${snippet}`, `${file} exposes internal reference ${snippet}`);
  });
});

const indexHtml = fileExists("distilleries/index.html")
  ? fs.readFileSync(path.join(DISTILLERIES_DIR, "index.html"), "utf8")
  : "";
const bracketHtml = fileExists("index.html") ? fs.readFileSync(BRACKET_FILE, "utf8") : "";

profileFiles.forEach((file) => {
  check(indexHtml.includes(`./${file}`), `Index links to ${file}`, `Index missing link to ${file}`);
  check(bracketHtml.includes(`distilleries/${file}`), `Bracket links to ${file}`, `Bracket missing profile link to ${file}`);
});

forbiddenPublicSnippets.forEach((snippet) => {
  check(!indexHtml.includes(snippet), `Profile index does not expose ${snippet}`, `Profile index exposes internal reference ${snippet}`);
});

const todo = fileExists("TODO.md") ? fs.readFileSync(TODO_FILE, "utf8") : "";
const todoLinks = [...todo.matchAll(/\(distilleries\/([^)]+\.html)\)/g)].map((match) => `distilleries/${match[1]}`);
const brokenTodoLinks = todoLinks.filter((relativePath) => !fileExists(relativePath));

check(todo.includes("docs/distillery-profile-pages/SKILL.md"), "TODO points future agents to profile-page skill", "TODO missing skill reference");
check(todoLinks.length >= 55, "TODO includes profile links for research order", `Expected at least 55 profile links in TODO, found ${todoLinks.length}`);
check(brokenTodoLinks.length === 0, "All TODO profile links resolve", `Broken TODO profile links:\n${brokenTodoLinks.join("\n")}`);
check(bracketHtml.includes('className = "profile-link"'), "Bracket renders dedicated profile links", "Bracket missing profile-link renderer");
check(bracketHtml.includes('target = "_blank"'), "Profile links open in a new tab", "Profile links do not target a new tab");
check(bracketHtml.includes("event.stopPropagation()"), "Profile link clicks stop propagation", "Profile links do not stop click propagation");

if (failures > 0) {
  console.log(`\n=== Distillery Profile Checks Failed: ${failures} issue(s) ===`);
  process.exit(1);
}

console.log("\n=== All Distillery Profile Checks Passed ===");
