/**
 * Responsive layout utilities.
 *
 * Pure functions — no DOM or window access.
 */

export const BREAKPOINTS = {
  compact:   800,
  medium:    1024,
  wide:      1440,
  ultrawide: 1920,
} as const;

export type LayoutMode = 'compact' | 'medium' | 'wide' | 'ultrawide';

/**
 * Determine the layout mode from a viewport width (px).
 */
export function getLayoutMode(width: number): LayoutMode {
  if (width >= BREAKPOINTS.ultrawide) return 'ultrawide';
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.medium) return 'medium';
  return 'compact';
}

/** Sidebar should be visible when width >= medium breakpoint. */
export function shouldShowSidebar(width: number): boolean {
  return width >= BREAKPOINTS.medium;
}

/** Sidebar should collapse (icon-only) when width < medium. */
export function shouldCollapseSidebar(width: number): boolean {
  return width < BREAKPOINTS.medium;
}

const CONTENT_MAX_WIDTHS: Record<LayoutMode, number> = {
  compact:   800,
  medium:    720,
  wide:      960,
  ultrawide: 1200,
};

/** Maximum content area width for a given layout mode. */
export function getContentMaxWidth(mode: LayoutMode): number {
  return CONTENT_MAX_WIDTHS[mode];
}

const SIDEBAR_WIDTHS: Record<LayoutMode, number> = {
  compact:   0,
  medium:    240,
  wide:      280,
  ultrawide: 320,
};

/** Sidebar width for a given layout mode. */
export function getSidebarWidth(mode: LayoutMode): number {
  return SIDEBAR_WIDTHS[mode];
}
