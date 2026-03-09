/**
 * Keyboard shortcut utilities.
 *
 * Pure functions — no DOM dependencies beyond the KeyboardEvent interface shape.
 */

export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export const KEYBOARD_SHORTCUTS: Record<string, KeyCombo> = {
  send:            { key: 'Enter' },
  newline:         { key: 'Enter', shift: true },
  closeModal:      { key: 'Escape' },
  toggleWorkspace: { key: 'w', ctrl: true, shift: true },
  newTab:          { key: 't', ctrl: true },
  closeTab:        { key: 'w', ctrl: true },
} as const;

export type ShortcutName = keyof typeof KEYBOARD_SHORTCUTS;

/** Minimal event shape — compatible with DOM KeyboardEvent and test mocks. */
export interface KeyEventLike {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/**
 * Check whether a keyboard event matches a shortcut definition.
 * Modifier flags default to `false` when omitted from the combo.
 */
export function matchesShortcut(event: KeyEventLike, shortcut: KeyCombo): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;
  if (!!shortcut.ctrl !== event.ctrlKey) return false;
  if (!!shortcut.shift !== event.shiftKey) return false;
  if (!!shortcut.alt !== event.altKey) return false;
  if (!!shortcut.meta !== event.metaKey) return false;
  return true;
}

/**
 * Format a shortcut for display.  e.g. `{ key: 'w', ctrl: true, shift: true }` → `"Ctrl+Shift+W"`.
 */
export function formatShortcut(shortcut: KeyCombo): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Meta');
  // Capitalise single-char keys; leave special keys as-is (Enter, Escape, etc.)
  const display = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  parts.push(display);
  return parts.join('+');
}

/**
 * Look up a named shortcut and check whether `event` matches it.
 * Returns `false` if the name is unknown.
 */
export function matchesNamedShortcut(event: KeyEventLike, name: ShortcutName): boolean {
  const combo = KEYBOARD_SHORTCUTS[name];
  if (!combo) return false;
  return matchesShortcut(event, combo);
}
