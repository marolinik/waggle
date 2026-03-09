/**
 * Theme token utility tests.
 */
import { describe, it, expect } from 'vitest';
import {
  THEME_TOKENS,
  getToken,
  getCssVariables,
  hexToRgb,
  relativeLuminance,
  getContrastRatio,
} from '../../src/components/common/theme-tokens.js';

// ── THEME_TOKENS constant ────────────────────────────────────────────

describe('THEME_TOKENS', () => {
  it('has dark and light themes', () => {
    expect(THEME_TOKENS).toHaveProperty('dark');
    expect(THEME_TOKENS).toHaveProperty('light');
  });

  it('dark theme has all required color tokens', () => {
    const t = THEME_TOKENS.dark;
    expect(t.bg).toBeDefined();
    expect(t.surface).toBeDefined();
    expect(t.text).toBeDefined();
    expect(t.primary).toBeDefined();
    expect(t.secondary).toBeDefined();
    expect(t.border).toBeDefined();
    expect(t.error).toBeDefined();
    expect(t.warning).toBeDefined();
    expect(t.success).toBeDefined();
  });

  it('light theme has all required color tokens', () => {
    const t = THEME_TOKENS.light;
    expect(t.bg).toBeDefined();
    expect(t.surface).toBeDefined();
    expect(t.text).toBeDefined();
    expect(t.primary).toBeDefined();
    expect(t.error).toBeDefined();
    expect(t.success).toBeDefined();
  });

  it('has spacing tokens', () => {
    expect(THEME_TOKENS.dark.spacingXs).toBe('4px');
    expect(THEME_TOKENS.dark.spacingMd).toBe('16px');
    expect(THEME_TOKENS.light.spacingLg).toBe('24px');
  });

  it('has radius tokens', () => {
    expect(THEME_TOKENS.dark.radiusSm).toBe('4px');
    expect(THEME_TOKENS.dark.radiusFull).toBe('9999px');
  });

  it('has shadow tokens', () => {
    expect(THEME_TOKENS.dark.shadowSm).toContain('rgba');
    expect(THEME_TOKENS.light.shadowMd).toContain('rgba');
  });

  it('has transition tokens', () => {
    expect(THEME_TOKENS.dark.transitionFast).toContain('ms');
    expect(THEME_TOKENS.light.transitionNormal).toContain('ease');
  });
});

// ── getToken ─────────────────────────────────────────────────────────

describe('getToken', () => {
  it('retrieves dark theme bg', () => {
    expect(getToken('dark', 'bg')).toBe('#0d1117');
  });

  it('retrieves light theme bg', () => {
    expect(getToken('light', 'bg')).toBe('#ffffff');
  });

  it('retrieves primary color for each theme', () => {
    expect(getToken('dark', 'primary')).toBe('#58a6ff');
    expect(getToken('light', 'primary')).toBe('#0969da');
  });

  it('retrieves spacing token', () => {
    expect(getToken('dark', 'spacingXl')).toBe('32px');
  });
});

// ── getCssVariables ──────────────────────────────────────────────────

describe('getCssVariables', () => {
  it('generates CSS custom properties for dark theme', () => {
    const css = getCssVariables('dark');
    expect(css).toContain('--waggle-bg: #0d1117;');
    expect(css).toContain('--waggle-surface: #161b22;');
    expect(css).toContain('--waggle-primary: #58a6ff;');
    expect(css).toContain('--waggle-border: #30363d;');
  });

  it('generates CSS custom properties for light theme', () => {
    const css = getCssVariables('light');
    expect(css).toContain('--waggle-bg: #ffffff;');
    expect(css).toContain('--waggle-text: #1f2328;');
  });

  it('converts camelCase to kebab-case', () => {
    const css = getCssVariables('dark');
    expect(css).toContain('--waggle-surface-hover:');
    expect(css).toContain('--waggle-text-secondary:');
    expect(css).toContain('--waggle-spacing-xs:');
    expect(css).toContain('--waggle-radius-full:');
    expect(css).toContain('--waggle-transition-fast:');
  });

  it('every line is a valid CSS declaration', () => {
    const lines = getCssVariables('dark').split('\n');
    for (const line of lines) {
      expect(line).toMatch(/^--waggle-[\w-]+: .+;$/);
    }
  });
});

// ── hexToRgb ─────────────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('parses 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('works without hash prefix', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });

  it('returns [0,0,0] for invalid input', () => {
    expect(hexToRgb('invalid')).toEqual([0, 0, 0]);
    expect(hexToRgb('')).toEqual([0, 0, 0]);
  });

  it('parses mixed case', () => {
    expect(hexToRgb('#FF8800')).toEqual([255, 136, 0]);
  });
});

// ── relativeLuminance ────────────────────────────────────────────────

describe('relativeLuminance', () => {
  it('returns ~0 for black', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 4);
  });

  it('returns ~1 for white', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 2);
  });

  it('returns value between 0 and 1 for mid-gray', () => {
    const lum = relativeLuminance('#808080');
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });
});

// ── getContrastRatio ─────────────────────────────────────────────────

describe('getContrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1:1 for same color', () => {
    expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 2);
  });

  it('is commutative (fg/bg order does not matter)', () => {
    const r1 = getContrastRatio('#0969da', '#ffffff');
    const r2 = getContrastRatio('#ffffff', '#0969da');
    expect(r1).toBeCloseTo(r2, 4);
  });

  it('dark theme text on bg meets WCAG AA (>= 4.5)', () => {
    const ratio = getContrastRatio(
      THEME_TOKENS.dark.text,
      THEME_TOKENS.dark.bg,
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('light theme text on bg meets WCAG AA (>= 4.5)', () => {
    const ratio = getContrastRatio(
      THEME_TOKENS.light.text,
      THEME_TOKENS.light.bg,
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('dark theme primary on bg has reasonable contrast', () => {
    const ratio = getContrastRatio(
      THEME_TOKENS.dark.primary,
      THEME_TOKENS.dark.bg,
    );
    expect(ratio).toBeGreaterThan(3);
  });

  it('light theme primary on bg has reasonable contrast', () => {
    const ratio = getContrastRatio(
      THEME_TOKENS.light.primary,
      THEME_TOKENS.light.bg,
    );
    expect(ratio).toBeGreaterThan(3);
  });
});
