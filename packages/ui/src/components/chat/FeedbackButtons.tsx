/**
 * FeedbackButtons — thumbs up/down feedback on each agent message.
 *
 * Appears below agent messages. On thumbs down, shows an inline reason
 * dropdown + optional detail text. After submit, shows a brief "Thanks!"
 * confirmation then hides.
 */

import React, { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

export type FeedbackRating = 'up' | 'down';

export type FeedbackReason =
  | 'wrong_answer'
  | 'too_verbose'
  | 'wrong_tool'
  | 'too_slow'
  | 'other';

export interface FeedbackButtonsProps {
  sessionId: string;
  messageIndex: number;
  onFeedback: (rating: FeedbackRating, reason?: FeedbackReason, detail?: string) => void;
}

// ── Reason options ─────────────────────────────────────────────────────

const REASON_OPTIONS: Array<{ value: FeedbackReason; label: string }> = [
  { value: 'wrong_answer', label: 'Wrong answer' },
  { value: 'too_verbose', label: 'Too verbose' },
  { value: 'wrong_tool', label: 'Wrong tool used' },
  { value: 'too_slow', label: 'Too slow' },
  { value: 'other', label: 'Other' },
];

// ── Component ──────────────────────────────────────────────────────────

type FeedbackState = 'idle' | 'reason_form' | 'submitted';

export function FeedbackButtons({ sessionId, messageIndex, onFeedback }: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>('idle');
  const [reason, setReason] = useState<FeedbackReason>('wrong_answer');
  const [detail, setDetail] = useState('');

  const handleThumbsUp = useCallback(() => {
    onFeedback('up');
    setState('submitted');
  }, [onFeedback]);

  const handleThumbsDown = useCallback(() => {
    setState('reason_form');
  }, []);

  const handleSubmitReason = useCallback(() => {
    onFeedback('down', reason, detail || undefined);
    setState('submitted');
  }, [onFeedback, reason, detail]);

  const handleCancel = useCallback(() => {
    setState('idle');
    setReason('wrong_answer');
    setDetail('');
  }, []);

  // After submission, show a brief thanks message
  if (state === 'submitted') {
    return (
      <div
        className="feedback-buttons feedback-buttons--submitted"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'var(--text-muted, #888)',
          padding: '2px 0',
        }}
      >
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  // Reason form (shown after thumbs down)
  if (state === 'reason_form') {
    return (
      <div
        className="feedback-buttons feedback-buttons--form"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '6px 0',
          maxWidth: 280,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as FeedbackReason)}
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid var(--border, #444)',
              background: 'var(--bg-secondary, #1a1a2e)',
              color: 'var(--text-primary, #e0e0e0)',
              outline: 'none',
              flex: 1,
            }}
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Optional detail..."
          maxLength={200}
          style={{
            fontSize: 11,
            padding: '3px 6px',
            borderRadius: 4,
            border: '1px solid var(--border, #444)',
            background: 'var(--bg-secondary, #1a1a2e)',
            color: 'var(--text-primary, #e0e0e0)',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleSubmitReason}
            style={{
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 4,
              border: '1px solid var(--border, #444)',
              background: 'var(--brand, #7c3aed)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
          <button
            onClick={handleCancel}
            style={{
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 4,
              border: '1px solid var(--border, #444)',
              background: 'transparent',
              color: 'var(--text-muted, #888)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Default idle state: thumbs up / thumbs down buttons
  return (
    <div
      className="feedback-buttons feedback-buttons--idle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 0',
      }}
    >
      <button
        onClick={handleThumbsUp}
        title="Good response"
        className="feedback-btn feedback-btn--up"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          padding: '1px 4px',
          borderRadius: 4,
          color: 'var(--text-muted, #888)',
          opacity: 0.6,
          transition: 'opacity 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#3fb950';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = 'var(--text-muted, #888)';
        }}
      >
        {'\u25B2'}
      </button>
      <button
        onClick={handleThumbsDown}
        title="Needs improvement"
        className="feedback-btn feedback-btn--down"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          padding: '1px 4px',
          borderRadius: 4,
          color: 'var(--text-muted, #888)',
          opacity: 0.6,
          transition: 'opacity 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#f85149';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = 'var(--text-muted, #888)';
        }}
      >
        {'\u25BC'}
      </button>
    </div>
  );
}
