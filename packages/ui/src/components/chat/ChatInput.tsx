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

/**
 * Client-only commands — these are handled entirely in the UI/client,
 * not by the server's CommandRegistry. Used as fallback when no
 * server commands are available, and always merged into the list.
 */
export const CLIENT_COMMANDS: SlashCommand[] = [
  { name: '/model', description: 'Switch AI model', args: '<model-name>' },
  { name: '/models', description: 'List available models' },
  { name: '/cost', description: 'Show token usage and cost' },
  { name: '/clear', description: 'Clear conversation history' },
  { name: '/identity', description: 'Show agent identity' },
  { name: '/awareness', description: 'Show agent awareness state' },
  { name: '/git', description: 'Show git status' },
];

export interface ChatInputProps {
  onSubmit: (text: string) => void;
  onSlashCommand?: (command: string, args: string) => void;
  onFileSelect?: (files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Merged command list from server + client. Falls back to CLIENT_COMMANDS. */
  commands?: SlashCommand[];
}

export function ChatInput({
  onSubmit,
  onSlashCommand,
  onFileSelect,
  disabled = false,
  placeholder = 'Type a message... (/ for commands)',
  commands,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const commandList = commands ?? CLIENT_COMMANDS;

  // Filter commands based on current input
  const filteredCommands = useMemo(() => {
    if (!text.startsWith('/')) return [];
    const query = text.toLowerCase();
    return commandList.filter(cmd =>
      cmd.name.toLowerCase().startsWith(query)
    );
  }, [text, commandList]);

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

  const isDisabledOrEmpty = disabled || !text.trim();

  return (
    <div className="chat-input relative border-t border-border bg-card p-3">
      {/* Slash command autocomplete popup */}
      {showCommands && (
        <div
          ref={commandsRef}
          className="absolute bottom-full left-3 right-3 bg-muted border border-border rounded-lg p-1 mb-1 max-h-60 overflow-y-auto z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"
        >
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.name}
              onClick={() => selectCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex items-center gap-3 w-full py-2 px-3 border-none rounded-md text-foreground cursor-pointer text-left text-[13px] font-mono ${
                i === selectedIndex ? 'bg-primary/15' : 'bg-transparent'
              }`}
            >
              <span className="text-primary font-semibold min-w-[90px]">
                {cmd.name}
              </span>
              <span className="text-muted-foreground text-xs font-[inherit]">
                {cmd.description}
              </span>
              {cmd.args && (
                <span className="text-muted-foreground/30 text-[11px] ml-auto">
                  {cmd.args}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input for the attachment button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0 && onFileSelect) {
            onFileSelect(Array.from(files));
          }
          // Reset so the same file can be selected again
          e.target.value = '';
        }}
      />

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        {onFileSelect && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach files"
            className={`chat-input__attach-btn rounded-lg border border-border bg-muted text-lg leading-none flex items-center justify-center py-2.5 px-3 ${
              disabled
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground cursor-pointer'
            }`}
          >
            +
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-muted py-2.5 px-3.5 text-foreground text-sm font-mono outline-none leading-normal"
        />
        <button
          onClick={handleSubmit}
          disabled={isDisabledOrEmpty}
          className={`rounded-lg border-none font-semibold text-[13px] font-mono py-2.5 px-5 ${
            isDisabledOrEmpty
              ? 'bg-muted text-muted-foreground/30 cursor-not-allowed'
              : 'bg-primary text-primary-foreground cursor-pointer'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
