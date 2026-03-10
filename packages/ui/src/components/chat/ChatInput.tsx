/**
 * ChatInput — multi-line text input with Enter-to-send, Shift+Enter for newline.
 * Supports slash commands with autocomplete popup.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface SlashCommand {
  name: string;
  description: string;
  args?: string;
}

export const BUILTIN_COMMANDS: SlashCommand[] = [
  { name: '/model', description: 'Switch AI model', args: '<model-name>' },
  { name: '/models', description: 'List available models' },
  { name: '/cost', description: 'Show token usage and cost' },
  { name: '/clear', description: 'Clear conversation history' },
  { name: '/identity', description: 'Show agent identity' },
  { name: '/awareness', description: 'Show agent awareness state' },
  { name: '/plan', description: 'Show current plan' },
  { name: '/git', description: 'Show git status' },
  { name: '/skills', description: 'List loaded skills' },
  { name: '/help', description: 'Show available commands' },
];

export interface ChatInputProps {
  onSubmit: (text: string) => void;
  onSlashCommand?: (command: string, args: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  onSlashCommand,
  disabled = false,
  placeholder = 'Type a message... (/ for commands)',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Filter commands based on current input
  const filteredCommands = useMemo(() => {
    if (!text.startsWith('/')) return [];
    const query = text.toLowerCase();
    return BUILTIN_COMMANDS.filter(cmd =>
      cmd.name.toLowerCase().startsWith(query)
    );
  }, [text]);

  // Show/hide command popup
  useEffect(() => {
    if (text.startsWith('/') && !text.includes(' ') && filteredCommands.length > 0) {
      setShowCommands(true);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
    }
  }, [text, filteredCommands.length]);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    // Check if it's a slash command
    if (trimmed.startsWith('/') && onSlashCommand) {
      const spaceIdx = trimmed.indexOf(' ');
      const command = spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed;
      const args = spaceIdx > 0 ? trimmed.slice(spaceIdx + 1).trim() : '';
      onSlashCommand(command, args);
    } else {
      onSubmit(trimmed);
    }
    setText('');
    setShowCommands(false);
    textareaRef.current?.focus();
  }, [text, disabled, onSubmit, onSlashCommand]);

  const selectCommand = useCallback((cmd: SlashCommand) => {
    if (cmd.args) {
      setText(cmd.name + ' ');
      setShowCommands(false);
      textareaRef.current?.focus();
    } else {
      setText(cmd.name);
      setShowCommands(false);
      // Auto-submit commands without args
      if (onSlashCommand) {
        onSlashCommand(cmd.name, '');
      }
      setText('');
      textareaRef.current?.focus();
    }
  }, [onSlashCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showCommands) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          return;
        }
        if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            selectCommand(filteredCommands[selectedIndex]);
          }
          return;
        }
        if (e.key === 'Escape') {
          setShowCommands(false);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, showCommands, filteredCommands, selectedIndex, selectCommand],
  );

  return (
    <div className="chat-input" style={{ position: 'relative', borderTop: '1px solid var(--border, #333)', background: 'var(--bg-secondary, #111)', padding: 12 }}>
      {/* Slash command autocomplete popup */}
      {showCommands && (
        <div
          ref={commandsRef}
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
            maxHeight: 240,
            overflowY: 'auto',
            zIndex: 50,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.name}
              onClick={() => selectCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                background: i === selectedIndex ? 'var(--brand-dim, rgba(232,146,15,0.15))' : 'transparent',
                color: 'var(--text, #e0e0e0)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span style={{ color: 'var(--brand, #E8920F)', fontWeight: 600, minWidth: 90 }}>
                {cmd.name}
              </span>
              <span style={{ color: 'var(--text-muted, #888)', fontSize: 12, fontFamily: 'inherit' }}>
                {cmd.description}
              </span>
              {cmd.args && (
                <span style={{ color: 'var(--text-dim, #555)', fontSize: 11, marginLeft: 'auto' }}>
                  {cmd.args}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: 8,
            border: '1px solid var(--border, #444)',
            background: 'var(--bg-input, #1a1a2e)',
            padding: '10px 14px',
            color: 'var(--text, #e0e0e0)',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', system-ui, sans-serif",
            outline: 'none',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          style={{
            borderRadius: 8,
            border: 'none',
            background: disabled || !text.trim() ? 'var(--bg-tertiary, #333)' : 'var(--brand, #E8920F)',
            color: disabled || !text.trim() ? 'var(--text-dim, #555)' : '#000',
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: 13,
            cursor: disabled || !text.trim() ? 'not-allowed' : 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
