#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DISTILLERIES_DIR = path.join(ROOT, "distilleries");
const TODO_FILE = path.join(ROOT, "TODO.md");

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

console.log("=== Distillery Profile Stub Test Suite ===\n");

check(fileExists("docs/distillery-profile-pages/SKILL.md"), "Profile-page skill exists", "Missing docs/distillery-profile-pages/SKILL.md");
check(fileExists("scripts/generate-distillery-stubs.js"), "Profile stub generator exists", "Missing scripts/generate-distillery-stubs.js");
check(fileExists("distilleries/index.html"), "Distillery index exists", "Missing distilleries/index.html");

const profileFiles = fs.existsSync(DISTILLERIES_DIR)
  ? fs.readdirSync(DISTILLERIES_DIR).filter((file) => file.endsWith(".html") && file !== "index.html")
  : [];

check(profileFiles.length === 55, "Generated 55 distillery profile pages", `Expected 55 distillery profile pages, found ${profileFiles.length}`);

const requiredSnippets = [
  "Official website: TODO",
  "Instagram: TODO",
  "<h2>Summary</h2>",
  "<h2>Product Portfolio</h2>",
  "<h2>Sources</h2>",
  "../data/BRACKET.md"
];

profileFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(DISTILLERIES_DIR, file), "utf8");
  requiredSnippets.forEach((snippet) => {
    check(html.includes(snippet), `${file} includes ${snippet}`, `${file} missing ${snippet}`);
  });
});

const indexHtml = fileExists("distilleries/index.html")
  ? fs.readFileSync(path.join(DISTILLERIES_DIR, "index.html"), "utf8")
  : "";

profileFiles.forEach((file) => {
  check(indexHtml.includes(`./${file}`), `Index links to ${file}`, `Index missing link to ${file}`);
});

const todo = fileExists("TODO.md") ? fs.readFileSync(TODO_FILE, "utf8") : "";
const todoLinks = [...todo.matchAll(/\(distilleries\/([^)]+\.html)\)/g)].map((match) => `distilleries/${match[1]}`);
const brokenTodoLinks = todoLinks.filter((relativePath) => !fileExists(relativePath));

check(todo.includes("docs/distillery-profile-pages/SKILL.md"), "TODO points future agents to profile-page skill", "TODO missing skill reference");
check(todoLinks.length >= 55, "TODO includes profile links for research order", `Expected at least 55 profile links in TODO, found ${todoLinks.length}`);
check(brokenTodoLinks.length === 0, "All TODO profile links resolve", `Broken TODO profile links:\n${brokenTodoLinks.join("\n")}`);

if (failures > 0) {
  console.log(`\n=== Distillery Profile Checks Failed: ${failures} issue(s) ===`);
  process.exit(1);
}

console.log("\n=== All Distillery Profile Checks Passed ===");
