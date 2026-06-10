export const STORAGE_KEYS = {
  bestLevel: "eidklinge.bestLevel",
  difficulty: "eidklinge.difficulty",
  settings: "eidklinge.settings.v3"
};

export const DIFFICULTIES = {
  easy: {
    label: "Leicht",
    enemyHealth: 0.78,
    enemyDamage: 0.72,
    enemySpeed: 0.78,
    enemyCooldown: 1.18,
    playerDamage: 1.12,
    staminaRegen: 1.18
  },
  normal: {
    label: "Normal",
    enemyHealth: 1,
    enemyDamage: 1,
    enemySpeed: 1,
    enemyCooldown: 1,
    playerDamage: 1,
    staminaRegen: 1
  },
  hard: {
    label: "Schwer",
    enemyHealth: 1.22,
    enemyDamage: 1.26,
    enemySpeed: 1.16,
    enemyCooldown: 0.86,
    playerDamage: 0.95,
    staminaRegen: 0.92
  },
  nightmare: {
    label: "Albtraum",
    enemyHealth: 1.55,
    enemyDamage: 1.58,
    enemySpeed: 1.32,
    enemyCooldown: 0.72,
    playerDamage: 0.9,
    staminaRegen: 0.82
  }
};

export const QUALITY_SETTINGS = {
  low: {
    label: "60 FPS",
    pixelRatio: 0.85,
    shadowMap: false,
    particles: 0.28,
    decorScale: 0.45,
    floorSegments: 42,
    wallSegments: 18,
    shadowSize: 0,
    hudHz: 10
  },
  medium: {
    label: "Ausgewogen",
    pixelRatio: 1,
    shadowMap: false,
    particles: 0.45,
    decorScale: 0.72,
    floorSegments: 56,
    wallSegments: 22,
    shadowSize: 0,
    hudHz: 12
  },
  high: {
    label: "Hoch",
    pixelRatio: 1.25,
    shadowMap: true,
    particles: 0.75,
    decorScale: 1,
    floorSegments: 72,
    wallSegments: 26,
    shadowSize: 1024,
    hudHz: 12
  }
};

export const PLAYER_CONFIG = {
  maxHealth: 120,
  maxStamina: 100,
  speed: 6.2,
  dashSpeed: 16,
  dashDuration: 0.18,
  dashCost: 24,
  blockDrainPerSecond: 13,
  blockReduction: 0.72,
  staminaRegenPerSecond: 24,
  staminaRegenDelay: 0.45,
  radius: 0.55
};

export const PLAYER_WEAPON = {
  name: "Eidklinge Morgenriss",
  range: 2.65,
  arc: Math.PI * 0.72,
  combo: [
    { label: "Schnitt", damage: 18, cost: 14, cooldown: 0.43 },
    { label: "Rueckhieb", damage: 22, cost: 17, cooldown: 0.5 },
    { label: "Eidstoss", damage: 31, cost: 24, cooldown: 0.7 }
  ],
  critChance: 0.14,
  critMultiplier: 1.55
};

export const ENEMY_TYPES = {
  ashling: {
    name: "Aschenlaeufer",
    color: 0x7b5662,
    accent: 0xd98b4a,
    health: 54,
    damage: 10,
    speed: 3.1,
    attackRange: 1.55,
    attackCooldown: 1.25,
    windup: 0.38,
    reach: 1.85,
    size: 0.92
  },
  thornGuard: {
    name: "Dornhueter",
    color: 0x3f6f56,
    accent: 0xa5d26d,
    health: 74,
    damage: 13,
    speed: 2.65,
    attackRange: 1.75,
    attackCooldown: 1.42,
    windup: 0.48,
    reach: 2.05,
    size: 1.08
  },
  cinderKnight: {
    name: "Glutritter",
    color: 0x60403e,
    accent: 0xe85936,
    health: 96,
    damage: 17,
    speed: 2.42,
    attackRange: 1.95,
    attackCooldown: 1.58,
    windup: 0.58,
    reach: 2.2,
    size: 1.22
  },
  glassDuelist: {
    name: "Glasspeer-Duellant",
    color: 0x5b8c9f,
    accent: 0x9ee8ff,
    health: 88,
    damage: 16,
    speed: 3.55,
    attackRange: 1.85,
    attackCooldown: 1.05,
    windup: 0.32,
    reach: 2.25,
    size: 1
  },
  emberRegent: {
    name: "Veyr, Glutregent",
    color: 0x40222a,
    accent: 0xffa247,
    health: 260,
    damage: 23,
    speed: 2.55,
    attackRange: 2.35,
    attackCooldown: 1.24,
    windup: 0.5,
    reach: 2.75,
    size: 1.62,
    boss: true
  }
};

export const LEVELS = [
  {
    id: "training",
    name: "Trainingsarena",
    subtitle: "Das erste Eidfeuer",
    story:
      "Unter alten Messingboegen lernt die Eidklinge wieder zu singen. Ein Aschenlaeufer prueft deinen ersten Schwur.",
    victory:
      "Das erste Eidfeuer knistert heller. Jenseits der Mauern ruft eine Ruine im Wald.",
    floor: 0x8b7c65,
    wall: 0x544b40,
    sky: 0x141922,
    fog: 0x111823,
    light: 0xffd79a,
    arenaSize: 24,
    enemies: [{ type: "ashling", count: 1 }]
  },
  {
    id: "forest",
    name: "Waldruine",
    subtitle: "Gruene Steine, dunkle Wurzeln",
    story:
      "Die Nachtwacht folgt Wurzelpfaden zu einem geborstenen Altar, wo Dornhueter ihre Klingen im Moos schaerfen.",
    victory:
      "Die Ruine gibt den Weg frei. Hinter dem Wald wartet ein Hof voller kalter Banner.",
    floor: 0x50604a,
    wall: 0x384137,
    sky: 0x102019,
    fog: 0x0f1b14,
    light: 0xa5d26d,
    arenaSize: 27,
    enemies: [
      { type: "ashling", count: 1 },
      { type: "thornGuard", count: 2 }
    ]
  },
  {
    id: "courtyard",
    name: "Burginnenhof",
    subtitle: "Stein unter Eisen",
    story:
      "Im Hof der leeren Burg hallen Schritte wie Trommeln. Glutritter halten die Tore mit schweren Klingen.",
    victory:
      "Das Burgtor splittert auf. Warme Asche zieht aus einer Kluft im Osten.",
    floor: 0x58606b,
    wall: 0x2f3541,
    sky: 0x151a25,
    fog: 0x10131b,
    light: 0xcbd6e8,
    arenaSize: 30,
    enemies: [
      { type: "thornGuard", count: 1 },
      { type: "cinderKnight", count: 2 },
      { type: "ashling", count: 1 }
    ]
  },
  {
    id: "lava",
    name: "Lavakluft",
    subtitle: "Die brennende Furt",
    story:
      "Die vierte Wacht steht auf schwarzem Gestein. Glaspeer-Duellanten tanzen zwischen Rissen aus rotem Licht.",
    victory:
      "Die Kluft schweigt fuer einen Atemzug. Nur der Glutregent bleibt im letzten Kreis.",
    floor: 0x2f2926,
    wall: 0x24191a,
    sky: 0x21100d,
    fog: 0x210f0b,
    light: 0xff7a35,
    arenaSize: 33,
    enemies: [
      { type: "glassDuelist", count: 2 },
      { type: "cinderKnight", count: 2 },
      { type: "thornGuard", count: 1 }
    ]
  },
  {
    id: "boss",
    name: "Boss-Arena",
    subtitle: "Kreis der fuenf Eidfeuer",
    story:
      "Im letzten Kreis hebt Veyr, der Glutregent, eine Krone aus Asche. Nur die Eidklinge kann den Morgen schneiden.",
    victory:
      "Veyrs Krone faellt in Staub. Die Nachtwacht sieht den ersten Morgen.",
    floor: 0x30253a,
    wall: 0x171521,
    sky: 0x0c0912,
    fog: 0x0a0710,
    light: 0xf4a261,
    arenaSize: 36,
    enemies: [
      { type: "emberRegent", count: 1 },
      { type: "glassDuelist", count: 2 }
    ]
  }
];
