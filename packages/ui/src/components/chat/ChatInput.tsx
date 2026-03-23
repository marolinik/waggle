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
  /** Current model name for quick-switch chip display */
  currentModel?: string;
  /** Available models for quick-switch dropdown */
  availableModels?: string[];
  /** Callback when user selects a model from quick-switch */
  onModelSwitch?: (model: string) => void;
}

/** Model color accents — subtle visual cue for which model is active */
const MODEL_COLORS: Record<string, string> = {
  opus: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sonnet: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  haiku: 'bg-green-500/20 text-green-400 border-green-500/30',
  gpt: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  gemini: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  default: 'bg-secondary text-muted-foreground border-border',
};

function getModelColor(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes('opus')) return MODEL_COLORS.opus;
  if (lower.includes('sonnet')) return MODEL_COLORS.sonnet;
  if (lower.includes('haiku')) return MODEL_COLORS.haiku;
  if (lower.includes('gpt')) return MODEL_COLORS.gpt;
  if (lower.includes('gemini')) return MODEL_COLORS.gemini;
  return MODEL_COLORS.default;
}

function formatModelName(model: string): string {
  return model
    .replace('claude-', '')
    .replace('gpt-', 'GPT-')
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function ChatInput({
  onSubmit,
  onSlashCommand,
  onFileSelect,
  disabled = false,
  placeholder = 'Type a message... (/ for commands)',
  commands,
  currentModel,
  availableModels,
  onModelSwitch,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModelPicker, setShowModelPicker] = useState(false);
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
    <div className="chat-input relative p-3" style={{ borderTop: '1px solid var(--hive-700)', backgroundColor: 'var(--hive-850)' }}>
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

      {/* Quick model switch chip */}
      {currentModel && (
        <div className="flex items-center gap-2 mb-1.5 px-0.5">
          <button
            onClick={() => onModelSwitch ? setShowModelPicker(!showModelPicker) : undefined}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-colors ${getModelColor(currentModel)} ${onModelSwitch ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            title={onModelSwitch ? 'Click to switch model' : currentModel}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {formatModelName(currentModel)}
            {onModelSwitch && <span className="text-[8px] opacity-50 ml-0.5">▼</span>}
          </button>
          {showModelPicker && availableModels && availableModels.length > 0 && (
            <div className="absolute bottom-full left-3 bg-muted border border-border rounded-lg p-1 mb-1 z-50 shadow-lg min-w-[180px]">
              {availableModels.map(m => (
                <button
                  key={m}
                  onClick={() => { onModelSwitch?.(m); setShowModelPicker(false); }}
                  className={`flex items-center gap-2 w-full py-1.5 px-2.5 rounded-md text-[11px] text-left transition-colors ${
                    m === currentModel ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${m === currentModel ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  {formatModelName(m)}
                  {m === currentModel && <span className="ml-auto text-[9px] text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          placeholder={placeholder || 'Message Waggle... (/ for commands)'}
          rows={1}
          className="flex-1 resize-none rounded-xl py-2.5 px-3.5 text-foreground text-sm outline-none leading-normal transition-all duration-150"
          style={{
            backgroundColor: 'var(--hive-800)',
            border: '1px solid var(--hive-700)',
            fontFamily: 'var(--font-sans)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--honey-500)';
            e.target.style.boxShadow = 'var(--shadow-honey)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--hive-700)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isDisabledOrEmpty}
          className="rounded-xl border-none font-semibold text-[13px] py-2.5 px-5 transition-all duration-150"
          style={{
            fontFamily: 'var(--font-sans)',
            ...(isDisabledOrEmpty
              ? { backgroundColor: 'var(--hive-700)', color: 'var(--hive-500)', cursor: 'not-allowed' }
              : { backgroundColor: 'var(--honey-500)', color: 'var(--hive-950)', cursor: 'pointer' }),
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
