/**
 * CommandPalette — floating popup showing matching slash commands.
 *
 * Appears above the chat input when the user types `/`.
 * Keyboard-navigable with up/down arrows and Enter to select.
 */

import React, { useEffect, useRef, useMemo } from 'react';

export interface CommandPaletteCommand {
  name: string;
  description: string;
  usage: string;
}

export interface CommandPaletteProps {
  commands: CommandPaletteCommand[];
  filter: string; // current text after /
  onSelect: (command: string) => void;
  onClose: () => void;
  visible: boolean;
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}

export function CommandPalette({
  commands,
  filter,
  onSelect,
  onClose,
  visible,
  selectedIndex = 0,
  onSelectedIndexChange,
}: CommandPaletteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands by the text typed after /
  const filtered = useMemo(() => {
    if (!filter) return commands;
    const lower = filter.toLowerCase();
    return commands.filter(
      cmd =>
        cmd.name.toLowerCase().includes(lower) ||
        cmd.description.toLowerCase().includes(lower),
    );
  }, [commands, filter]);

  // Scroll selected item into view
  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('[data-command-item]');
    const activeItem = items[selectedIndex];
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle keyboard events — parent should call onClose on Escape,
  // but we also handle global Escape for safety.
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Command palette"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 12,
        right: 12,
        background: 'var(--bg-tertiary, #1a1a2e)',
        border: '1px solid var(--border, #333)',
        borderRadius: 8,
        padding: 4,
        marginBottom: 4,
        maxHeight: 300,
        overflowY: 'auto',
        zIndex: 50,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.name}
          data-command-item
          role="option"
          aria-selected={i === selectedIndex}
          onClick={() => onSelect(cmd.name)}
          onMouseEnter={() => onSelectedIndexChange?.(i)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            background:
              i === selectedIndex
                ? 'var(--brand-dim, rgba(232,146,15,0.15))'
                : 'transparent',
            color: 'var(--text, #e0e0e0)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span
            style={{
              color: 'var(--brand, #E8920F)',
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            /{cmd.name}
          </span>
          <span
            style={{
              color: 'var(--text-muted, #888)',
              fontSize: 12,
              fontFamily: 'inherit',
              flex: 1,
            }}
          >
            {cmd.description}
          </span>
          {cmd.usage && (
            <span
              style={{
                color: 'var(--text-dim, #555)',
                fontSize: 11,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {cmd.usage}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
