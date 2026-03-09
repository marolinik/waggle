/**
 * Modal — simple modal overlay.
 *
 * Centered card with title bar. Click backdrop or press Escape to close.
 */

import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="waggle-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="waggle-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--waggle-surface, #1a1a2e)',
          border: '1px solid var(--waggle-border, #333)',
          borderRadius: 8,
          minWidth: 320,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          className="waggle-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--waggle-border, #333)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', color: 'var(--waggle-text, #e0e0e0)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--waggle-text-muted, #888)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {'\u00D7'}
          </button>
        </div>
        <div
          className="waggle-modal-body"
          style={{ padding: '16px', overflow: 'auto', color: 'var(--waggle-text, #e0e0e0)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
