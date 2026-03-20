/**
 * ReadyStep — final onboarding step: celebration + optional memory import + start.
 *
 * The import section is optional — users can skip straight to "Start working".
 * If they import, they see a preview of extracted knowledge before committing.
 */

import React, { useState, useRef, useCallback } from 'react';

export interface ReadyStepProps {
  name: string;
  onComplete: () => void;
  /** Base URL for the local server API (defaults to http://127.0.0.1:3333) */
  baseUrl?: string;
}

interface ImportPreview {
  source: string;
  conversationsFound: number;
  conversationsParsed: number;
  knowledgeExtracted: Array<{
    type: string;
    content: string;
    importance: string;
  }>;
  errors: string[];
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:3333';

const FEATURE_HIGHLIGHTS = [
  {
    title: 'Persistent memory',
    description: 'I remember decisions, preferences, and context across every session.',
    icon: '◆',
    color: 'var(--primary, #d4a843)',
  },
  {
    title: 'Workspace isolation',
    description: 'Each project gets its own memory, sessions, and context — no cross-contamination.',
    icon: '◈',
    color: 'var(--accent, #c084fc)',
  },
  {
    title: 'Local-first & private',
    description: 'Everything stored locally in encrypted .mind files. Your data never leaves your machine.',
    icon: '◇',
    color: 'var(--success, #3ecf8e)',
  },
];

const TYPE_COLORS: Record<string, string> = {
  decision: 'var(--primary, #d4a843)',
  preference: 'var(--accent, #c084fc)',
  fact: 'var(--success, #3ecf8e)',
  topic: 'var(--text-dim)',
};

const TYPE_ICONS: Record<string, string> = {
  decision: '◆',
  preference: '◈',
  fact: '◇',
  topic: '○',
};

export function ReadyStep({ name, onComplete, baseUrl = DEFAULT_BASE_URL }: ReadyStepProps) {
  const [showImport, setShowImport] = useState(false);
  const [importSource, setImportSource] = useState<'chatgpt' | 'claude' | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importSource) return;

    setImportError(null);
    setPreview(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch(`${baseUrl}/api/import/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, source: importSource }),
      });

      if (!res.ok) {
        setImportError('Failed to parse export file');
        return;
      }

      const result = await res.json();
      setPreview(result);

      if (result.errors?.length > 0) {
        setImportError(result.errors[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(msg.includes('JSON') ? 'Invalid JSON file. Make sure you selected the conversations.json file.' : msg);
    }
  }, [importSource]);

  const handleCommit = useCallback(async () => {
    if (!preview || !importSource) return;

    setImporting(true);
    setImportError(null);

    try {
      // Re-read the file for commit (preview was dry-run)
      const file = fileRef.current?.files?.[0];
      if (!file) { setImportError('File no longer available'); setImporting(false); return; }

      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch(`${baseUrl}/api/import/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, source: importSource }),
      });

      if (!res.ok) {
        setImportError('Import failed');
        setImporting(false);
        return;
      }

      const result = await res.json();
      setSavedCount(result.saved ?? 0);
      setImportDone(true);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }, [preview, importSource]);

  return (
    <div className="ready-step flex flex-col items-center gap-6 p-8 max-w-[560px] mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="text-[28px] font-bold text-foreground -tracking-wide">
          You're all set{name ? `, ${name}` : ''}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Your workspace is ready. Here's what makes Waggle different:
        </p>
      </div>

      {/* Feature highlights */}
      <div className="flex w-full flex-col gap-3">
        {FEATURE_HIGHLIGHTS.map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-xl px-4 py-3.5 flex gap-3 items-start">
            <span className="text-sm shrink-0 mt-0.5" style={{ color: f.color }}>{f.icon}</span>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground m-0">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Memory Import Section ──────────────────────────────── */}
      {!importDone && (
        <div className="w-full mt-1">
          {!showImport ? (
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-[10px] px-5 py-2 text-[13px] font-medium text-muted-foreground cursor-pointer transition-all duration-150 hover:border-primary/30"
            >
              <span className="text-primary text-sm">◆</span>
              Import memory from ChatGPT or Claude
            </button>
          ) : (
            <div className="bg-card border border-border rounded-xl px-4 py-3.5 flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Import prior conversations</div>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                Waggle can extract decisions, preferences, and key facts from your ChatGPT or Claude conversation history.
                Export your data from the source app, then select the JSON file here.
              </p>

              {/* Source selection */}
              {!importSource && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setImportSource('chatgpt')} className="flex-1 bg-card border border-border rounded-[10px] px-5 py-2 text-[13px] font-medium text-muted-foreground cursor-pointer transition-all duration-150 hover:border-primary/30">
                    ChatGPT Export
                  </button>
                  <button type="button" onClick={() => setImportSource('claude')} className="flex-1 bg-card border border-border rounded-[10px] px-5 py-2 text-[13px] font-medium text-muted-foreground cursor-pointer transition-all duration-150 hover:border-primary/30">
                    Claude Export
                  </button>
                </div>
              )}

              {/* File picker */}
              {importSource && !preview && (
                <div>
                  <p className="text-[11px] text-muted-foreground/40 mb-2">
                    {importSource === 'chatgpt'
                      ? 'Select conversations.json from your ChatGPT export (Settings → Data Controls → Export Data)'
                      : 'Select the JSON file from your Claude export (Settings → Account → Export Data)'}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground w-full font-inherit"
                  />
                </div>
              )}

              {/* Preview */}
              {preview && !importDone && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-2">
                    Preview — {preview.conversationsParsed} conversations, {preview.knowledgeExtracted.length} items found
                  </div>

                  {preview.knowledgeExtracted.length === 0 ? (
                    <p className="text-xs text-muted-foreground/40">
                      No decisions, preferences, or facts found in these conversations.
                    </p>
                  ) : (
                    <div className="max-h-[180px] overflow-y-auto flex flex-col gap-1">
                      {preview.knowledgeExtracted.slice(0, 15).map((item, i) => (
                        <div key={i} className="flex gap-2 items-baseline text-[11px] text-muted-foreground py-[3px]">
                          <span className="shrink-0 text-[10px]" style={{ color: TYPE_COLORS[item.type] ?? 'var(--text-dim)' }}>
                            {TYPE_ICONS[item.type] ?? '\u00B7'}
                          </span>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.content}
                          </span>
                        </div>
                      ))}
                      {preview.knowledgeExtracted.length > 15 && (
                        <div className="text-[10px] text-muted-foreground/40 pt-1">
                          + {preview.knowledgeExtracted.length - 15} more items
                        </div>
                      )}
                    </div>
                  )}

                  {preview.knowledgeExtracted.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleCommit}
                        disabled={importing}
                        className={`flex-1 bg-primary text-primary-foreground border-none rounded-[10px] px-6 py-2.5 text-sm font-bold cursor-pointer transition-all duration-150 ${importing ? 'opacity-60' : ''}`}
                      >
                        {importing ? 'Importing...' : `Import ${preview.knowledgeExtracted.length} items`}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPreview(null); setImportSource(null); }}
                        className="bg-card border border-border rounded-[10px] px-5 py-2 text-[13px] font-medium text-muted-foreground cursor-pointer transition-all duration-150 hover:border-primary/30"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {importError && (
                <p className="text-[11px] text-destructive">{importError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Import success message */}
      {importDone && (
        <div className="bg-card border border-green-500/20 rounded-xl px-4 py-3.5 w-full flex gap-2.5 items-center">
          <span className="text-green-500 text-base">&#10003;</span>
          <span className="text-[13px] text-foreground">
            Imported {savedCount} items from {importSource === 'chatgpt' ? 'ChatGPT' : 'Claude'} into your memory
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="text-center mt-1">
        <p className="text-xs text-muted-foreground/40 mb-4">
          {importDone
            ? 'Your imported knowledge is ready. Start a conversation and I\'ll use it.'
            : 'Try asking: "What can you help me with?" or "Catch me up on this workspace"'}
        </p>
        <button type="button" onClick={onComplete} className="bg-primary text-primary-foreground border-none rounded-[10px] px-8 py-3 text-[15px] font-bold cursor-pointer transition-all duration-150 shadow-[0_0_20px_rgba(212,168,67,0.15)]">
          Start working &rarr;
        </button>
      </div>
    </div>
  );
}
