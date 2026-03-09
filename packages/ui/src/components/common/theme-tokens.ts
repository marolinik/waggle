/**
 * Theme token definitions and helpers.
 *
 * Pure functions — no DOM access.
 */

export interface ThemeTokenSet {
  // Colors
  bg: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  border: string;
  borderFocus: string;
  error: string;
  warning: string;
  success: string;

  // Spacing
  spacingXs: string;
  spacingSm: string;
  spacingMd: string;
  spacingLg: string;
  spacingXl: string;

  // Radii
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;

  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;

  // Transitions
  transitionFast: string;
  transitionNormal: string;
}

export const THEME_TOKENS: Record<'dark' | 'light', ThemeTokenSet> = {
  dark: {
    bg:             '#0d1117',
    surface:        '#161b22',
    surfaceHover:   '#1c2129',
    text:           '#e6edf3',
    textSecondary:  '#8b949e',
    primary:        '#58a6ff',
    primaryHover:   '#79c0ff',
    secondary:      '#388bfd',
    border:         '#30363d',
    borderFocus:    '#58a6ff',
    error:          '#f85149',
    warning:        '#d29922',
    success:        '#3fb950',

    spacingXs: '4px',
    spacingSm: '8px',
    spacingMd: '16px',
    spacingLg: '24px',
    spacingXl: '32px',

    radiusSm: '4px',
    radiusMd: '8px',
    radiusLg: '12px',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
    shadowMd: '0 4px 8px rgba(0,0,0,0.4)',
    shadowLg: '0 8px 24px rgba(0,0,0,0.5)',

    transitionFast:   '100ms ease',
    transitionNormal: '200ms ease',
  },
  light: {
    bg:             '#ffffff',
    surface:        '#f6f8fa',
    surfaceHover:   '#eef1f5',
    text:           '#1f2328',
    textSecondary:  '#656d76',
    primary:        '#0969da',
    primaryHover:   '#0550ae',
    secondary:      '#218bff',
    border:         '#d0d7de',
    borderFocus:    '#0969da',
    error:          '#cf222e',
    warning:        '#bf8700',
    success:        '#1a7f37',

    spacingXs: '4px',
    spacingSm: '8px',
    spacingMd: '16px',
    spacingLg: '24px',
    spacingXl: '32px',

    radiusSm: '4px',
    radiusMd: '8px',
    radiusLg: '12px',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px rgba(0,0,0,0.06)',
    shadowMd: '0 4px 8px rgba(0,0,0,0.08)',
    shadowLg: '0 8px 24px rgba(0,0,0,0.12)',

    transitionFast:   '100ms ease',
    transitionNormal: '200ms ease',
  },
};

/** Retrieve a single token value. */
export function getToken(theme: 'dark' | 'light', token: keyof ThemeTokenSet): string {
  return THEME_TOKENS[theme][token];
}

/** Generate CSS custom property declarations for a theme (no selector wrapper). */
export function getCssVariables(theme: 'dark' | 'light'): string {
  const tokens = THEME_TOKENS[theme];
  return Object.entries(tokens)
    .map(([key, value]) => {
      // camelCase → kebab-case
      const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `--waggle-${kebab}: ${value};`;
    })
    .join('\n');
}

/**
 * Parse a hex color (3 or 6 digit) to [r, g, b].
 * Returns [0,0,0] for invalid input.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    return [
      parseInt(cleaned[0] + cleaned[0], 16),
      parseInt(cleaned[1] + cleaned[1], 16),
      parseInt(cleaned[2] + cleaned[2], 16),
    ];
  }
  if (cleaned.length === 6) {
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ];
  }
  return [0, 0, 0];
}

/**
 * Relative luminance of a color per WCAG 2.1.
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two hex colours.
 * Returns a value >= 1 (higher = more contrast).
 */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
