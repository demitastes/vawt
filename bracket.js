const firstRound = [
  ["Open Road", "Brady's", "Old House", "Three Crosses"],
  ["New Realm", "Lost Whiskey Co", "Highlands", "Springfield"],
  ["KO Distilling", "Mean Spirits", "Reservoir"],
  ["Deep Creek", "Five Mile Mountain", "Ironclad"],
  ["River Hill", "Cape Charles", "Virginia Distillery Co"],
  ["Silverback", "River City", "Spirit Lab"],
  ["Reverend Spirits", "Bon Durant Brothers", "Twin Creeks", "GW's Grist Mill"],
  ["Ragged Branch", "Devil's Backbone", "Tarnished Truth", "Blue Sky"],
  ["Blue Shepherd", "Caiseal", "Bold Rock"],
  ["Three Wives", "Davis Valley", "Climax"],
  ["Filibuster", "A. Smith Bowman", "Mt Defiance"],
  ["Catoctin Creek", "Virginia Foothills", "Copper Fox"],
  ["Appalachian Heritage", "Sandy River", "Belmont Farm"],
  ["Creek Bottom", "Cool Springs", "Trial & Error", "J.H. Bards"],
  ["Murlarkey", "Three Notches", "Lincoln Ridge", "Hilltop"],
  ["Sleepy Fox", "Bell Isle", "Franklin County", "Axe Handle"]
];

const distilleryProfiles = {
  "Open Road": "distilleries/open-road.html",
  "Brady's": "distilleries/bradys.html",
  "Old House": "distilleries/old-house.html",
  "Three Crosses": "distilleries/three-crosses.html",
  "New Realm": "distilleries/new-realm-brewing-and-distilling.html",
  "Lost Whiskey Co": "distilleries/lost-whiskey.html",
  "Highlands": "distilleries/highlands-distilling-co.html",
  "Springfield": "distilleries/springfield-distillery.html",
  "KO Distilling": "distilleries/ko-distilling.html",
  "Mean Spirits": "distilleries/mean-spirits-distilling.html",
  "Reservoir": "distilleries/reservoir-distillery.html",
  "Deep Creek": "distilleries/deep-creek.html",
  "Five Mile Mountain": "distilleries/five-mile-mountain.html",
  "Ironclad": "distilleries/ironclad.html",
  "River Hill": "distilleries/river-hill.html",
  "Cape Charles": "distilleries/cape-charles.html",
  "Virginia Distillery Co": "distilleries/virginia-distillery-co.html",
  "Silverback": "distilleries/silverback.html",
  "River City": "distilleries/river-city.html",
  "Spirit Lab": "distilleries/spirit-lab-distilling.html",
  "Reverend Spirits": "distilleries/reverend-spirits.html",
  "Bon Durant Brothers": "distilleries/bon-durant-brothers-distillery.html",
  "Twin Creeks": "distilleries/twin-creeks-distillery.html",
  "GW's Grist Mill": "distilleries/george-washingtons-grist-mill-distillery.html",
  "Ragged Branch": "distilleries/ragged-branch.html",
  "Devil's Backbone": "distilleries/devils-backbone.html",
  "Tarnished Truth": "distilleries/tarnished-truth.html",
  "Blue Sky": "distilleries/blue-sky.html",
  "Blue Shepherd": "distilleries/blue-shepherd-spirits.html",
  "Caiseal": "distilleries/caiseal-vanguard.html",
  "Bold Rock": "distilleries/bold-rock-distillery.html",
  "Three Wives": "distilleries/three-wives-distillery-winchester.html",
  "Davis Valley": "distilleries/davis-valley-distillery.html",
  "Climax": "distilleries/climax.html",
  "Filibuster": "distilleries/filibuster-distillery.html",
  "A. Smith Bowman": "distilleries/a-smith-bowman.html",
  "Mt Defiance": "distilleries/mt-defiance-cidery-and-distillery-old-bolstead.html",
  "Catoctin Creek": "distilleries/catoctin-creek-distilling-co.html",
  "Virginia Foothills": "distilleries/virginia-foothills-distillery.html",
  "Copper Fox": "distilleries/copper-fox.html",
  "Appalachian Heritage": "distilleries/appalachian-heritage-distillery.html",
  "Sandy River": "distilleries/sandy-river-distillery.html",
  "Belmont Farm": "distilleries/belmont-farm-distillery.html",
  "Creek Bottom": "distilleries/creek-bottom.html",
  "Cool Springs": "distilleries/cool-springs.html",
  "Trial & Error": "distilleries/trial-and-error.html",
  "J.H. Bards": "distilleries/j-h-bards.html",
  "Murlarkey": "distilleries/murlarkey.html",
  "Three Notches": "distilleries/three-notches-brewery-and-distillery.html",
  "Lincoln Ridge": "distilleries/lincoln-ridge-distillery.html",
  "Hilltop": "distilleries/hilltop-distillery.html",
  "Sleepy Fox": "distilleries/sleepy-fox.html",
  "Bell Isle": "distilleries/bell-isle.html",
  "Franklin County": "distilleries/franklin-county-distillers.html",
  "Axe Handle": "distilleries/axe-handle-distilling.html"
};

const rounds = [
  { round: 1, bouts: 16 },
  { round: 2, bouts: 8 },
  { round: 3, bouts: 4 },
  { round: 4, bouts: 2 },
  { round: 5, bouts: 1 }
];

let boutData = [
  {"round":1,"bout":1,"dateRange":{"start":"2026-05-30","end":"2026-06-05"},"links":{"instagram":"https://www.instagram.com/p/DZDF_ikASrH/","youtube":"https://www.youtube.com/post/UgkxUmjksF2IY9cTtGlu9wRG0uFsW-KZ0O22"}},
  {"round":1,"bout":2,"dateRange":{"start":"2026-05-30","end":"2026-06-05"},"links":{"instagram":"https://www.instagram.com/p/DZDGxpYgkms/","youtube":"https://www.youtube.com/post/Ugkxb0oL3X_mBtAPzHmf5X9Y8oiwGaqwgfVW"}},
  {"round":1,"bout":3,"dateRange":{"start":"2026-06-06","end":"2026-06-12"},"links":{}},
  {"round":1,"bout":4,"dateRange":{"start":"2026-06-06","end":"2026-06-12"},"links":{}},
  {"round":1,"bout":5,"dateRange":{"start":"2026-06-13","end":"2026-06-19"},"links":{}},
  {"round":1,"bout":6,"dateRange":{"start":"2026-06-13","end":"2026-06-19"},"links":{}},
  {"round":1,"bout":7,"dateRange":{"start":"2026-06-20","end":"2026-06-26"},"links":{}},
  {"round":1,"bout":8,"dateRange":{"start":"2026-06-20","end":"2026-06-26"},"links":{}},
  {"round":1,"bout":9,"dateRange":{"start":"2026-06-27","end":"2026-07-03"},"links":{}},
  {"round":1,"bout":10,"dateRange":{"start":"2026-06-27","end":"2026-07-03"},"links":{}},
  {"round":1,"bout":11,"dateRange":{"start":"2026-07-04","end":"2026-07-10"},"links":{}},
  {"round":1,"bout":12,"dateRange":{"start":"2026-07-04","end":"2026-07-10"},"links":{}},
  {"round":1,"bout":13,"dateRange":{"start":"2026-07-11","end":"2026-07-17"},"links":{}},
  {"round":1,"bout":14,"dateRange":{"start":"2026-07-11","end":"2026-07-17"},"links":{}},
  {"round":1,"bout":15,"dateRange":{"start":"2026-07-18","end":"2026-07-24"},"links":{}},
  {"round":1,"bout":16,"dateRange":{"start":"2026-07-18","end":"2026-07-24"},"links":{}},
  {"round":2,"bout":1,"dateRange":{"start":"2026-07-25","end":"2026-07-31"},"links":{}},
  {"round":2,"bout":2,"dateRange":{"start":"2026-08-01","end":"2026-08-07"},"links":{}},
  {"round":2,"bout":3,"dateRange":{"start":"2026-08-08","end":"2026-08-14"},"links":{}},
  {"round":2,"bout":4,"dateRange":{"start":"2026-08-15","end":"2026-08-21"},"links":{}},
  {"round":2,"bout":5,"dateRange":{"start":"2026-08-22","end":"2026-08-28"},"links":{}},
  {"round":2,"bout":6,"dateRange":{"start":"2026-08-29","end":"2026-09-04"},"links":{}},
  {"round":2,"bout":7,"dateRange":{"start":"2026-09-05","end":"2026-09-11"},"links":{}},
  {"round":2,"bout":8,"dateRange":{"start":"2026-09-12","end":"2026-09-18"},"links":{}},
  {"round":3,"bout":1,"dateRange":{"start":"2026-09-19","end":"2026-09-25"},"links":{}},
  {"round":3,"bout":2,"dateRange":{"start":"2026-09-26","end":"2026-10-02"},"links":{}},
  {"round":3,"bout":3,"dateRange":{"start":"2026-10-03","end":"2026-10-09"},"links":{}},
  {"round":3,"bout":4,"dateRange":{"start":"2026-10-10","end":"2026-10-16"},"links":{}},
  {"round":4,"bout":1,"dateRange":{"start":"2026-10-17","end":"2026-10-23"},"links":{}},
  {"round":4,"bout":2,"dateRange":{"start":"2026-10-24","end":"2026-10-30"},"links":{}},
  {"round":5,"bout":1,"dateRange":{"start":"2026-10-31","end":"2026-11-06"},"links":{}}
];

function getBoutInfo(round, bout) {
  return boutData.find(b => b.round === round && b.bout === bout);
}

const bracket = document.querySelector("#bracket");
const connectors = document.querySelector(".connectors");
const resetSelectionsButton = document.querySelector("#reset-selections");
const winners = new Map();
const organizerWinners = new Map();
const STORAGE_KEY = "vawt-2026-bracket-selections";

function key(round, bout) {
  return `r${round}b${bout}`;
}

function boutKeyToParts(boutKey) {
  const match = /^r(\d+)b(\d+)$/.exec(boutKey);
  if (!match) return null;
  return {
    round: Number(match[1]),
    bout: Number(match[2])
  };
}

function organizerWinnerFor(info) {
  if (!info) return "";
  const winner = info.organizerWinner || info.winner || info.result;
  if (typeof winner === "string") return winner;
  if (winner && typeof winner.winner === "string") return winner.winner;
  return "";
}

function loadOrganizerWinners() {
  organizerWinners.clear();

  boutData.forEach((info) => {
    const winner = organizerWinnerFor(info);
    if (winner) {
      organizerWinners.set(key(info.round, info.bout), winner);
    }
  });
}

function applyOrganizerWinners() {
  organizerWinners.forEach((winner, boutKey) => {
    winners.set(boutKey, winner);
  });
}

function selectionsForStorage() {
  return Array.from(winners.entries()).filter(([boutKey]) => {
    return !organizerWinners.has(boutKey);
  });
}

function saveSelections() {
  try {
    const selections = selectionsForStorage();
    if (selections.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch (error) {
    // Browsers can disable localStorage; bracket picking still works in memory.
  }
}

function loadSavedSelections() {
  let savedSelections = [];

  try {
    const rawSelections = localStorage.getItem(STORAGE_KEY);
    if (!rawSelections) return;

    const parsedSelections = JSON.parse(rawSelections);
    if (!Array.isArray(parsedSelections)) return;
    savedSelections = parsedSelections;
  } catch (error) {
    return;
  }

  const normalizedSelections = savedSelections
    .map(([boutKey, winner]) => {
      const parts = boutKeyToParts(boutKey);
      if (!parts || typeof winner !== "string") return null;
      return { ...parts, boutKey, winner };
    })
    .filter(Boolean)
    .sort((a, b) => a.round - b.round || a.bout - b.bout);

  normalizedSelections.forEach(({ round, bout, boutKey, winner }) => {
    if (organizerWinners.has(boutKey)) return;
    if (entrantsFor(round, bout).includes(winner)) {
      winners.set(boutKey, winner);
    }
  });
}

function resetSelections() {
  const restoreScroll = preserveScrollPosition();
  winners.clear();
  applyOrganizerWinners();
  saveSelections();
  render({ restoreScroll });
}

function sideForBout(bout) {
  return bout % 2 === 1 ? "left" : "right";
}

function columnFor(round, side) {
  if (round === 5) return 5;
  return side === "left" ? round : 10 - round;
}

function boutDate(round, bout) {
  const info = getBoutInfo(round, bout);
  if (!info || !info.dateRange) return "";
  const fmt = { month: "short", day: "numeric", timeZone: "UTC" };
  const start = new Date(info.dateRange.start).toLocaleDateString("en-US", fmt);
  const end   = new Date(info.dateRange.end).toLocaleDateString("en-US", fmt);
  return `${start} – ${end}`;
}

function isActiveBout(round, bout) {
  const info = getBoutInfo(round, bout);
  if (!info || !info.dateRange) return false;
  const now = new Date();
  const startDate = new Date(info.dateRange.start + "T00:00:00-04:00");
  const endDate = new Date(info.dateRange.end + "T23:59:59-04:00");
  return now >= startDate && now <= endDate;
}

function feedersFor(round, bout) {
  if (round === 5) {
    return [
      { round: 4, bout: 1 },
      { round: 4, bout: 2 }
    ];
  }

  const sideIndex = Math.ceil(bout / 2);
  const firstFeeder = bout % 2 === 1 ? (sideIndex * 4) - 3 : (sideIndex * 4) - 2;
  return [
    { round: round - 1, bout: firstFeeder },
    { round: round - 1, bout: firstFeeder + 2 }
  ];
}

function targetFor(round, bout) {
  if (round === 4) {
    return { round: 5, bout: 1 };
  }

  const sideIndex = Math.ceil(bout / 2);
  const nextSideIndex = Math.ceil(sideIndex / 2);
  const nextBout = bout % 2 === 1 ? (nextSideIndex * 2) - 1 : nextSideIndex * 2;
  return { round: round + 1, bout: nextBout };
}

function entrantsFor(round, bout) {
  if (round === 1) return firstRound[bout - 1];
  if (round === 5) return [winners.get(key(4, 1)) || "Round 4 Bout 1 Winner", winners.get(key(4, 2)) || "Round 4 Bout 2 Winner"];

  return feedersFor(round, bout).map((feeder) => {
    return winners.get(key(feeder.round, feeder.bout)) || `Round ${feeder.round} Bout ${feeder.bout} Winner`;
  });
}

function clearDownstream(round, bout, previousWinner) {
  if (!previousWinner) return;

  let target = targetFor(round, bout);
  let displacedWinner = previousWinner;

  while (target.round <= 5) {
    const targetKey = key(target.round, target.bout);
    const targetWinner = winners.get(targetKey);

    if (targetWinner !== displacedWinner) {
      break;
    }

    if (!organizerWinners.has(targetKey)) {
      winners.delete(targetKey);
    }

    displacedWinner = targetWinner;
    if (target.round === 5) break;
    target = targetFor(target.round, target.bout);
  }
}

function preserveScrollPosition() {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  return () => {
    window.scrollTo(scrollX, scrollY);
  };
}

function selectWinner(round, bout, winner) {
  const boutKey = key(round, bout);
  if (organizerWinners.has(boutKey)) return;
  const previousWinner = winners.get(boutKey);
  if (previousWinner === winner) return;
  const restoreScroll = preserveScrollPosition();
  clearDownstream(round, bout, previousWinner);
  winners.set(boutKey, winner);
  saveSelections();
  render({ restoreScroll });
}

function profileUrlFor(name) {
  return distilleryProfiles[name] || "";
}

function createBout(round, bout) {
  const boutEl = document.createElement("article");
  boutEl.className = "bout";
  if (isActiveBout(round, bout)) {
    boutEl.classList.add("is-active");
  }
  boutEl.dataset.round = round;
  boutEl.dataset.bout = bout;
  boutEl.dataset.side = round === 5 ? "center" : sideForBout(bout);

  const label = document.createElement("div");
  label.className = "bout-label";
  label.textContent = round === 5 ? "Final" : `Round ${round} Bout ${bout}`;

  const dateContainer = document.createElement("div");
  dateContainer.className = "bout-date-container";

  const date = document.createElement("div");
  date.className = "bout-date";
  date.textContent = boutDate(round, bout);
  dateContainer.appendChild(date);

  if (isActiveBout(round, bout)) {
    const indicator = document.createElement("div");
    indicator.className = "bout-active-indicator";
    dateContainer.appendChild(indicator);
  }

  const matchup = document.createElement("div");
  matchup.className = "matchup";
  if (isActiveBout(round, bout)) {
    matchup.classList.add("is-active");
  }

  entrantsFor(round, bout).forEach((name) => {
    const row = document.createElement("div");
    row.className = "competitor-row";

    const competitor = document.createElement("button");
    competitor.type = "button";
    competitor.className = "competitor";
    competitor.textContent = name;
    competitor.disabled = name.includes(" Winner");
    if (organizerWinners.has(key(round, bout))) {
      competitor.disabled = true;
    }

    if (winners.get(key(round, bout)) === name) {
      competitor.classList.add("is-winner");
    }

    if (organizerWinners.get(key(round, bout)) === name) {
      competitor.classList.add("is-organizer-winner");
      competitor.textContent = "🏆 " + name;
    }

    competitor.addEventListener("click", (event) => {
      event.preventDefault();
      selectWinner(round, bout, name);
    });
    row.appendChild(competitor);

    const profileUrl = profileUrlFor(name);
    if (profileUrl) {
      const profileLink = document.createElement("a");
      profileLink.className = "profile-link";
      profileLink.href = profileUrl;
      profileLink.target = "_blank";
      profileLink.rel = "noopener noreferrer";
      profileLink.textContent = "Profile";
      profileLink.title = `Open ${name} profile in a new tab`;
      profileLink.setAttribute("aria-label", `Open ${name} profile in a new tab`);
      profileLink.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      row.appendChild(profileLink);
    }

    matchup.appendChild(row);
  });

  const bodyElements = [label, dateContainer, matchup];

  const info = getBoutInfo(round, bout);
  const links = info && info.links;
  if (links && (links.instagram || links.twitter || links.youtube || links.discord)) {
    const linksContainer = document.createElement("div");
    linksContainer.className = "bout-links";

    const voteLabel = document.createElement("span");
    voteLabel.className = "vote-label";
    voteLabel.textContent = "Vote:";
    linksContainer.appendChild(voteLabel);

    const linkConfigs = [
      { key: "instagram", label: "IG", title: "Vote on Instagram" },
      { key: "twitter", label: "X", title: "Vote on X" },
      { key: "youtube", label: "YT", title: "Vote on YouTube" },
      { key: "discord", label: "DC", title: "Join Discord" }
    ];

    linkConfigs.forEach(({ key: linkKey, label: linkLabel, title: linkTitle }) => {
      if (links[linkKey]) {
        const link = document.createElement("a");
        link.className = "bout-link";
        link.href = links[linkKey];
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = linkLabel;
        link.title = linkTitle;
        linksContainer.appendChild(link);
      }
    });

    bodyElements.push(linksContainer);
  }

  boutEl.append(...bodyElements);
  return boutEl;
}

function createColumn(round, side) {
  const column = document.createElement("div");
  column.className = "round-column";
  column.dataset.round = round;
  column.dataset.side = side;
  column.style.gridColumn = columnFor(round, side);

  for (let bout = 1; bout <= rounds[round - 1].bouts; bout += 1) {
    if (sideForBout(bout) === side) {
      column.appendChild(createBout(round, bout));
    }
  }

  return column;
}

function createCenter() {
  const center = document.createElement("div");
  center.className = "championship";
  center.style.gridColumn = "5";
  center.appendChild(createBout(5, 1));

  const champion = document.createElement("div");
  champion.className = "champion";
  champion.textContent = '🏆 ' + ( winners.get(key(5, 1)) || "Champion" ) + ' 🏆';
  center.appendChild(champion);
  return center;
}

function boutElement(round, bout) {
  return document.querySelector(`.bout[data-round="${round}"][data-bout="${bout}"]`);
}

function layoutBracket() {
  const firstRoundGap = 46;
  const edgePadding = 10;
  const positions = new Map();

  ["left", "right"].forEach((side) => {
    let cursor = edgePadding;

    for (let bout = 1; bout <= rounds[0].bouts; bout += 1) {
      if (sideForBout(bout) !== side) continue;

      const el = boutElement(1, bout);
      positions.set(key(1, bout), cursor);
      el.style.top = `${cursor}px`;
      el.style.transform = "none";
      cursor += el.offsetHeight + firstRoundGap;
    }
  });

  for (let round = 2; round <= 5; round += 1) {
    for (let bout = 1; bout <= rounds[round - 1].bouts; bout += 1) {
      const el = boutElement(round, bout);
      const feeders = feedersFor(round, bout);
      const feederCenters = feeders.map((feeder) => {
        const feederEl = boutElement(feeder.round, feeder.bout);
        return positions.get(key(feeder.round, feeder.bout)) + (feederEl.offsetHeight / 2);
      });
      const center = feederCenters.reduce((total, item) => total + item, 0) / feederCenters.length;
      const top = center - (el.offsetHeight / 2);

      positions.set(key(round, bout), top);
      el.style.top = `${top}px`;
      el.style.transform = "none";
    }
  }

  const finalBout = boutElement(5, 1);
  const champion = document.querySelector(".champion");
  const championTop = positions.get(key(5, 1)) + finalBout.offsetHeight + 18;
  champion.style.top = `${championTop}px`;

  const maxBottom = Math.max(
    ...Array.from(document.querySelectorAll(".bout")).map((el) => el.offsetTop + el.offsetHeight),
    championTop + champion.offsetHeight
  ) + edgePadding;

  bracket.style.height = `${maxBottom}px`;
  document.querySelectorAll(".round-column, .championship").forEach((column) => {
    column.style.height = `${maxBottom}px`;
  });
  connectors.style.height = `${maxBottom}px`;
}

function drawConnectors() {
  connectors.innerHTML = "";
  const svgRect = connectors.getBoundingClientRect();
  connectors.setAttribute("viewBox", `0 0 ${svgRect.width} ${svgRect.height}`);

  function pointFor(el, side) {
    const rect = el.querySelector(".matchup").getBoundingClientRect();
    const x = (side === "left" ? rect.left : rect.right) - svgRect.left;
    const y = rect.top + (rect.height / 2) - svgRect.top;
    return { x, y };
  }

  for (let round = 1; round <= 4; round += 1) {
    for (let bout = 1; bout <= rounds[round - 1].bouts; bout += 1) {
      const source = document.querySelector(`.bout[data-round="${round}"][data-bout="${bout}"]`);
      const next = targetFor(round, bout);
      const target = document.querySelector(`.bout[data-round="${next.round}"][data-bout="${next.bout}"]`);
      if (!source || !target) continue;

      const sourceSide = source.dataset.side;
      const start = pointFor(source, sourceSide === "left" ? "right" : "left");
      const end = pointFor(target, sourceSide === "left" ? "left" : "right");
      const run = Math.max(22, Math.abs(end.x - start.x) * 0.38);
      const c1x = sourceSide === "left" ? start.x + run : start.x - run;
      const c2x = sourceSide === "left" ? end.x - run : end.x + run;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

      path.setAttribute("d", `M ${start.x} ${start.y} C ${c1x} ${start.y}, ${c2x} ${end.y}, ${end.x} ${end.y}`);
      connectors.appendChild(path);
    }
  }
}

function resetDesktopLayoutStyles() {
  bracket.style.height = "";
  connectors.style.height = "";
  connectors.removeAttribute("viewBox");
  connectors.innerHTML = "";

  document.querySelectorAll(".bout, .round-column, .championship, .champion").forEach((el) => {
    el.style.top = "";
    el.style.height = "";
    el.style.transform = "";
  });
}

function isMobile() {
  return window.innerWidth < 720;
}

function render({ restoreScroll } = {}) {
  const mobileLayout = isMobile();
  const previousHeight = bracket.style.height || (bracket.offsetHeight ? `${bracket.offsetHeight}px` : "");

  if (mobileLayout) {
    resetDesktopLayoutStyles();
  } else if (previousHeight) {
    bracket.style.minHeight = previousHeight;
  }

  bracket.innerHTML = "";
  connectors.style.display = "";
  connectors.innerHTML = "";

  for (let round = 1; round <= 4; round += 1) {
    bracket.appendChild(createColumn(round, "left"));
  }

  bracket.appendChild(createCenter());

  for (let round = 4; round >= 1; round -= 1) {
    bracket.appendChild(createColumn(round, "right"));
  }

  if (mobileLayout) {
    resetDesktopLayoutStyles();
    if (restoreScroll) restoreScroll();
    return;
  }

  requestAnimationFrame(() => {
    layoutBracket();
    drawConnectors();
    bracket.style.minHeight = "";
    if (restoreScroll) restoreScroll();
  });
}

let wasMobile = isMobile();
let resizeFrame = null;
window.addEventListener("resize", () => {
  const nowMobile = isMobile();

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
  }

  if (wasMobile !== nowMobile) {
    wasMobile = nowMobile;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      render();
    });
  } else if (!nowMobile) {
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      layoutBracket();
      drawConnectors();
    });
  }
});

resetSelectionsButton.addEventListener("click", resetSelections);

loadOrganizerWinners();
applyOrganizerWinners();
loadSavedSelections();
render();
