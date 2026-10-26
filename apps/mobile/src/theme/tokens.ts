// Design tokens mirrored for programmatic use (e.g. icon colors, charts).
// Source of truth: design/pih-design-tokens.json. Keep in sync.
// Prefer NativeWind className tokens in components; use these only where a
// raw color value is unavoidable (AGENTS.md rule #1).

export const status = {
  normal: { fg: '#1F5C3A', bg: '#DDEBE1', word: 'Normal' as const },
  watch: { fg: '#7A4A00', bg: '#FBEBC8', word: 'Watch' as const },
  act: { fg: '#9C3420', bg: '#F8DDD5', solid: '#B5412A', word: 'Act' as const },
} as const;

export type StatusKey = keyof typeof status;

export const brand = {
  green900: '#143D26',
  green700: '#1F5C3A',
  green500: '#3E8559',
  green100: '#DDEBE1',
} as const;

export const surface = {
  background: '#FAF6EC',
  card: '#FFFFFF',
  border: '#E6DFCD',
} as const;

export const touch = {
  min: 48,
  primary: 56,
} as const;
