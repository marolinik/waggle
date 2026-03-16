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

const BASE_URL = 'http://127.0.0.1:3333';

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

export function ReadyStep({ name, onComplete }: ReadyStepProps) {
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

      const res = await fetch(`${BASE_URL}/api/import/preview`, {
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
    } catch (err: any) {
      setImportError(err.message?.includes('JSON') ? 'Invalid JSON file. Make sure you selected the conversations.json file.' : err.message);
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

      const res = await fetch(`${BASE_URL}/api/import/commit`, {
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
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }, [preview, importSource]);

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface, #14141e)',
    border: '1px solid var(--border, rgba(255,255,255,0.06))',
    borderRadius: 12,
    padding: '14px 16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--text-dim)',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const btnPrimary: React.CSSProperties = {
    background: 'var(--primary, #d4a843)',
    color: '#0a0a12',
    border: 'none',
    borderRadius: 10,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Inter, system-ui, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  const btnSecondary: React.CSSProperties = {
    background: 'var(--surface-2, #1a1a26)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border, rgba(255,255,255,0.06))',
    borderRadius: 10,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div className="ready-step flex flex-col items-center gap-6 p-8" style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-bright, #ededef)',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em',
        }}>
          You're all set{name ? `, ${name}` : ''}
        </div>
        <p style={{
          fontSize: 14, color: 'var(--text-muted)',
          fontFamily: 'Inter, system-ui, sans-serif', marginTop: 8,
        }}>
          Your workspace is ready. Here's what makes Waggle different:
        </p>
      </div>

      {/* Feature highlights */}
      <div className="flex w-full flex-col gap-3">
        {FEATURE_HIGHLIGHTS.map((f) => (
          <div key={f.title} style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: f.color, fontSize: 14, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Memory Import Section ──────────────────────────────── */}
      {!importDone && (
        <div style={{ width: '100%', marginTop: 4 }}>
          {!showImport ? (
            <button
              type="button"
              onClick={() => setShowImport(true)}
              style={{
                ...btnSecondary,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: 'var(--primary)', fontSize: 14 }}>◆</span>
              Import memory from ChatGPT or Claude
            </button>
          ) : (
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={labelStyle}>Import prior conversations</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Waggle can extract decisions, preferences, and key facts from your ChatGPT or Claude conversation history.
                Export your data from the source app, then select the JSON file here.
              </p>

              {/* Source selection */}
              {!importSource && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setImportSource('chatgpt')} style={{ ...btnSecondary, flex: 1 }}>
                    ChatGPT Export
                  </button>
                  <button type="button" onClick={() => setImportSource('claude')} style={{ ...btnSecondary, flex: 1 }}>
                    Claude Export
                  </button>
                </div>
              )}

              {/* File picker */}
              {importSource && !preview && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                    {importSource === 'chatgpt'
                      ? 'Select conversations.json from your ChatGPT export (Settings → Data Controls → Export Data)'
                      : 'Select the JSON file from your Claude export (Settings → Account → Export Data)'}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--text)',
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}

              {/* Preview */}
              {preview && !importDone && (
                <div>
                  <div style={{ ...labelStyle, marginBottom: 8 }}>
                    Preview — {preview.conversationsParsed} conversations, {preview.knowledgeExtracted.length} items found
                  </div>

                  {preview.knowledgeExtracted.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      No decisions, preferences, or facts found in these conversations.
                    </p>
                  ) : (
                    <div style={{
                      maxHeight: 180, overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      {preview.knowledgeExtracted.slice(0, 15).map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 8, alignItems: 'baseline',
                          fontSize: 11, color: 'var(--text-muted)',
                          padding: '3px 0',
                        }}>
                          <span style={{ color: TYPE_COLORS[item.type] ?? 'var(--text-dim)', flexShrink: 0, fontSize: 10 }}>
                            {TYPE_ICONS[item.type] ?? '·'}
                          </span>
                          <span style={{
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                          }}>
                            {item.content}
                          </span>
                        </div>
                      ))}
                      {preview.knowledgeExtracted.length > 15 && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', paddingTop: 4 }}>
                          + {preview.knowledgeExtracted.length - 15} more items
                        </div>
                      )}
                    </div>
                  )}

                  {preview.knowledgeExtracted.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={handleCommit}
                        disabled={importing}
                        style={{ ...btnPrimary, flex: 1, opacity: importing ? 0.6 : 1 }}
                      >
                        {importing ? 'Importing...' : `Import ${preview.knowledgeExtracted.length} items`}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPreview(null); setImportSource(null); }}
                        style={btnSecondary}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {importError && (
                <p style={{ fontSize: 11, color: 'var(--error, #ef4444)' }}>{importError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Import success message */}
      {importDone && (
        <div style={{
          ...cardStyle,
          width: '100%',
          borderColor: 'rgba(62, 207, 142, 0.2)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ color: 'var(--success)', fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>
            Imported {savedCount} items from {importSource === 'chatgpt' ? 'ChatGPT' : 'Claude'} into your memory
          </span>
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <p style={{
          fontSize: 12, color: 'var(--text-dim)',
          marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {importDone
            ? 'Your imported knowledge is ready. Start a conversation and I\'ll use it.'
            : 'Try asking: "What can you help me with?" or "Catch me up on this workspace"'}
        </p>
        <button type="button" onClick={onComplete} style={{
          ...btnPrimary,
          padding: '12px 32px',
          fontSize: 15,
          boxShadow: '0 0 20px rgba(212, 168, 67, 0.15)',
        }}>
          Start working →
        </button>
      </div>
    </div>
  );
}
