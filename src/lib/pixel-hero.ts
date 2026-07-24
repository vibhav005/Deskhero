// ---------------------------------------------------------------------------
// Pixel hero sprite data — a small, code-drawn avatar that gains gear as the
// player levels up. No image assets: each row is a string of color keys on a
// fixed grid, composited at render time.
// ---------------------------------------------------------------------------

export const HERO_GRID_W = 10;
export const HERO_GRID_H = 12;

/** "." is transparent. Every row must be exactly HERO_GRID_W characters. */
const BASE_SPRITE: string[] = [
  "...HHHH...",
  "..HHHHHH..",
  "..HSSSSH..",
  "..SESSES..",
  "..SSSSSS..",
  "...SSSS...",
  ".BBBBBBBB.",
  "BBBBBBBBBB",
  "BBBCCCCBBB",
  "BBSBBBBSBB",
  "..PP..PP..",
  ".PPP..PPP.",
];

export const HERO_COLORS: Record<string, string> = {
  H: "#8a5a34", // hair
  S: "#f2c396", // skin
  E: "#2b2320", // eyes
  B: "hsl(var(--primary))", // tunic
  C: "hsl(var(--primary) / 55%)", // belt shade
  P: "hsl(var(--foreground) / 70%)", // boots
  A: "hsl(var(--accent))", // headband / cape
  G: "#9aa5ad", // shield
  M: "#c8cdd2", // gauntlets
  Y: "#f5c744", // crown
  V: "#d7dee3", // sword
};

export interface GearPiece {
  id: string;
  name: string;
  minLevel: number;
  /** rowIndex -> HERO_GRID_W-length pattern, "." = leave base pixel untouched. */
  rows: Record<number, string>;
}

/** Gear unlocks cumulatively as the player's level rises. */
export const GEAR: GearPiece[] = [
  {
    id: "headband",
    name: "Focus headband",
    minLevel: 2,
    rows: { 2: "..AAAAAA.." },
  },
  {
    id: "shield",
    name: "Posture shield",
    minLevel: 3,
    rows: {
      6: "GG........",
      7: "GG........",
      8: "GG........",
    },
  },
  {
    id: "cape",
    name: "Momentum cape",
    minLevel: 4,
    rows: {
      5: ".........A",
      6: ".........A",
      7: ".........A",
      8: ".........A",
      9: ".........A",
      10: ".........A",
      11: ".........A",
    },
  },
  {
    id: "gauntlets",
    name: "Strength gauntlets",
    minLevel: 5,
    rows: { 9: "..M....M.." },
  },
  {
    id: "aura",
    name: "Energy aura",
    minLevel: 6,
    rows: {},
  },
  {
    id: "crown-sword",
    name: "Hero's crown & blade",
    minLevel: 7,
    rows: {
      0: "...YYYY...",
      6: "........V.",
      7: "........V.",
      8: "........V.",
      9: "........V.",
    },
  },
];

/** Build the sprite rows for a given level by layering unlocked gear onto the base body. */
export function composeHeroSprite(level: number): string[] {
  const grid = BASE_SPRITE.map((row) => row.split(""));
  for (const gear of GEAR) {
    if (level < gear.minLevel) continue;
    for (const [rowKey, pattern] of Object.entries(gear.rows)) {
      const r = Number(rowKey);
      for (let c = 0; c < HERO_GRID_W; c++) {
        if (pattern[c] !== ".") grid[r][c] = pattern[c];
      }
    }
  }
  return grid.map((row) => row.join(""));
}

/** The next piece of gear the player hasn't unlocked yet, if any. */
export function nextGearUnlock(level: number): GearPiece | null {
  return GEAR.find((g) => g.minLevel > level) ?? null;
}
