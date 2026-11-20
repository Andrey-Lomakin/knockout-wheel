export type SeasonalLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SeasonalTheme {
  level: SeasonalLevel;
  snowflakes: number;
  garland: 'none' | 'small' | 'full' | 'gold';
  wheelLights: boolean;
  ornaments: boolean;
  snowCaps: boolean;
  fireworks: boolean;
}

const INACTIVE: SeasonalTheme = {
  level: 0,
  snowflakes: 0,
  garland: 'none',
  wheelLights: false,
  ornaments: false,
  snowCaps: false,
  fireworks: false,
};

const THEMES: Record<Exclude<SeasonalLevel, 0>, SeasonalTheme> = {
  1: { ...INACTIVE, level: 1, snowflakes: 10 },
  2: { ...INACTIVE, level: 2, snowflakes: 18, garland: 'small' },
  3: { ...INACTIVE, level: 3, snowflakes: 26, garland: 'small', wheelLights: true },
  4: { ...INACTIVE, level: 4, snowflakes: 34, garland: 'small', wheelLights: true, ornaments: true },
  5: { ...INACTIVE, level: 5, snowflakes: 42, garland: 'small', wheelLights: true, ornaments: true, snowCaps: true },
  6: { ...INACTIVE, level: 6, snowflakes: 52, garland: 'full', wheelLights: true, ornaments: true, snowCaps: true },
  7: { ...INACTIVE, level: 7, snowflakes: 64, garland: 'gold', wheelLights: true, ornaments: true, snowCaps: true, fireworks: true },
};

function levelForDate(date: Date): SeasonalLevel {
  const month = date.getMonth();
  const day = date.getDate();

  if (month === 11) {
    if (day === 31) return 7;
    if (day >= 26) return 6;
    if (day >= 21) return 5;
    if (day >= 16) return 4;
    if (day >= 11) return 3;
    if (day >= 6) return 2;
    return 1;
  }

  if (month === 0) {
    if (day <= 5) return 5;
    if (day <= 10) return 3;
    if (day <= 15) return 2;
    if (day <= 20) return 1;
  }

  return 0;
}

function getSeasonalThemeByLevel(level: SeasonalLevel): SeasonalTheme {
  return level === 0 ? INACTIVE : THEMES[level];
}

export function getSeasonalTheme(date = new Date()): SeasonalTheme {
  return getSeasonalThemeByLevel(levelForDate(date));
}
