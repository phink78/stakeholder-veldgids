export const tokens = {
  paper: '#FBF9F4',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F1EA',
  ink: '#1A1614',
  inkMuted: '#6B635A',
  inkSubtle: '#A39B92',
  accent: '#7A3F2E',
  accentSoft: '#EDE3DC',
  rule: '#E8E2D8',
  aiAccent: '#3D6B5C',
  aiSoft: '#E4ECE8',
  avgPub: '#3E7D4F',
  avgPubSoft: '#E6EFE7',
  warn: '#B7791F',
  warnSoft: '#F4EBD9',
  serif: "'Source Serif 4', 'Source Serif Pro', Georgia, serif",
  sans: "'Inter Tight', 'Inter', -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'IBM Plex Mono', monospace",
} as const

export type Tokens = typeof tokens
