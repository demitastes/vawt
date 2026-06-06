const firstRound = [
  ["Open Road", "Brady's", "Old House", "Three Crosses"],
  ["New Realm", "Lost Whiskey", "Highlands Distilling", "Springfield Distillery"],
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
  "New Realm": "distilleries/new-realm.html",
  "Lost Whiskey": "distilleries/lost-whiskey.html",
  "Highlands Distilling": "distilleries/highlands-distilling.html",
  "Springfield Distillery": "distilleries/springfield-distillery.html",
  "KO Distilling": "distilleries/ko-distilling.html",
  "Mean Spirits": "distilleries/mean-spirits.html",
  "Reservoir": "distilleries/reservoir.html",
  "Deep Creek": "distilleries/deep-creek.html",
  "Five Mile Mountain": "distilleries/five-mile-mountain.html",
  "Ironclad": "distilleries/ironclad.html",
  "River Hill": "distilleries/river-hill.html",
  "Cape Charles": "distilleries/cape-charles.html",
  "Virginia Distillery Co": "distilleries/virginia-distillery-co.html",
  "Silverback": "distilleries/silverback.html",
  "River City": "distilleries/river-city.html",
  "Spirit Lab": "distilleries/spirit-lab.html",
  "Reverend Spirits": "distilleries/reverend-spirits.html",
  "Bon Durant Brothers": "distilleries/bon-durant-brothers.html",
  "Twin Creeks": "distilleries/twin-creeks.html",
  "GW's Grist Mill": "distilleries/gws-grist-mill.html",
  "Ragged Branch": "distilleries/ragged-branch.html",
  "Devil's Backbone": "distilleries/devils-backbone.html",
  "Tarnished Truth": "distilleries/tarnished-truth.html",
  "Blue Sky": "distilleries/blue-sky.html",
  "Blue Shepherd": "distilleries/blue-shepherd.html",
  "Caiseal": "distilleries/caiseal.html",
  "Bold Rock": "distilleries/bold-rock.html",
  "Three Wives": "distilleries/three-wives.html",
  "Davis Valley": "distilleries/davis-valley.html",
  "Climax": "distilleries/climax.html",
  "Filibuster": "distilleries/filibuster.html",
  "A. Smith Bowman": "distilleries/a-smith-bowman.html",
  "Mt Defiance": "distilleries/mt-defiance.html",
  "Catoctin Creek": "distilleries/catoctin-creek.html",
  "Virginia Foothills": "distilleries/virginia-foothills.html",
  "Copper Fox": "distilleries/copper-fox.html",
  "Appalachian Heritage": "distilleries/appalachian-heritage.html",
  "Sandy River": "distilleries/sandy-river.html",
  "Belmont Farm": "distilleries/belmont-farm.html",
  "Creek Bottom": "distilleries/creek-bottom.html",
  "Cool Springs": "distilleries/cool-springs.html",
  "Trial & Error": "distilleries/trial-error.html",
  "J.H. Bards": "distilleries/j-h-bards.html",
  "Murlarkey": "distilleries/murlarkey.html",
  "Three Notches": "distilleries/three-notches.html",
  "Lincoln Ridge": "distilleries/lincoln-ridge.html",
  "Hilltop": "distilleries/hilltop.html",
  "Sleepy Fox": "distilleries/sleepy-fox.html",
  "Bell Isle": "distilleries/bell-isle.html",
  "Franklin County": "distilleries/franklin-county.html",
  "Axe Handle": "distilleries/axe-handle.html"
};

const rounds = [
  { round: 1, bouts: 16 },
  { round: 2, bouts: 8 },
  { round: 3, bouts: 4 },
  { round: 4, bouts: 2 },
  { round: 5, bouts: 1 }
];

let boutData = [
  {
    "round": 1,
    "bout": 1,
    "dateRange": {
      "start": "2026-05-30",
      "end": "2026-06-05"
    },
    "links": {
      "instagram": "https://www.instagram.com/p/DZDF_ikASrH/",
      "youtube": "https://www.youtube.com/post/UgkxUmjksF2IY9cTtGlu9wRG0uFsW-KZ0O22"
    }
  },
  {
    "round": 1,
    "bout": 2,
    "dateRange": {
      "start": "2026-05-30",
      "end": "2026-06-05"
    },
    "links": {
      "instagram": "https://www.instagram.com/p/DZDGxpYgkms/",
      "youtube": "https://www.youtube.com/post/Ugkxb0oL3X_mBtAPzHmf5X9Y8oiwGaqwgfVW"
    }
  },
  {
    "round": 1,
    "bout": 3,
    "dateRange": {
      "start": "2026-06-06",
      "end": "2026-06-12"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 4,
    "dateRange": {
      "start": "2026-06-06",
      "end": "2026-06-12"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 5,
    "dateRange": {
      "start": "2026-06-13",
      "end": "2026-06-19"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 6,
    "dateRange": {
      "start": "2026-06-13",
      "end": "2026-06-19"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 7,
    "dateRange": {
      "start": "2026-06-20",
      "end": "2026-06-26"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 8,
    "dateRange": {
      "start": "2026-06-20",
      "end": "2026-06-26"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 9,
    "dateRange": {
      "start": "2026-06-27",
      "end": "2026-07-03"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 10,
    "dateRange": {
      "start": "2026-06-27",
      "end": "2026-07-03"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 11,
    "dateRange": {
      "start": "2026-07-04",
      "end": "2026-07-10"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 12,
    "dateRange": {
      "start": "2026-07-04",
      "end": "2026-07-10"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 13,
    "dateRange": {
      "start": "2026-07-11",
      "end": "2026-07-17"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 14,
    "dateRange": {
      "start": "2026-07-11",
      "end": "2026-07-17"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 15,
    "dateRange": {
      "start": "2026-07-18",
      "end": "2026-07-24"
    },
    "links": {}
  },
  {
    "round": 1,
    "bout": 16,
    "dateRange": {
      "start": "2026-07-18",
      "end": "2026-07-24"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 1,
    "dateRange": {
      "start": "2026-07-25",
      "end": "2026-07-31"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 2,
    "dateRange": {
      "start": "2026-08-01",
      "end": "2026-08-07"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 3,
    "dateRange": {
      "start": "2026-08-08",
      "end": "2026-08-14"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 4,
    "dateRange": {
      "start": "2026-08-15",
      "end": "2026-08-21"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 5,
    "dateRange": {
      "start": "2026-08-22",
      "end": "2026-08-28"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 6,
    "dateRange": {
      "start": "2026-08-29",
      "end": "2026-09-04"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 7,
    "dateRange": {
      "start": "2026-09-05",
      "end": "2026-09-11"
    },
    "links": {}
  },
  {
    "round": 2,
    "bout": 8,
    "dateRange": {
      "start": "2026-09-12",
      "end": "2026-09-18"
    },
    "links": {}
  },
  {
    "round": 3,
    "bout": 1,
    "dateRange": {
      "start": "2026-09-19",
      "end": "2026-09-25"
    },
    "links": {}
  },
  {
    "round": 3,
    "bout": 2,
    "dateRange": {
      "start": "2026-09-26",
      "end": "2026-10-02"
    },
    "links": {}
  },
  {
    "round": 3,
    "bout": 3,
    "dateRange": {
      "start": "2026-10-03",
      "end": "2026-10-09"
    },
    "links": {}
  },
  {
    "round": 3,
    "bout": 4,
    "dateRange": {
      "start": "2026-10-10",
      "end": "2026-10-16"
    },
    "links": {}
  },
  {
    "round": 4,
    "bout": 1,
    "dateRange": {
      "start": "2026-10-17",
      "end": "2026-10-23"
    },
    "links": {}
  },
  {
    "round": 4,
    "bout": 2,
    "dateRange": {
      "start": "2026-10-24",
      "end": "2026-10-30"
    },
    "links": {}
  },
  {
    "round": 5,
    "bout": 1,
    "dateRange": {
      "start": "2026-10-31",
      "end": "2026-11-06"
    },
    "links": {}
  }
];