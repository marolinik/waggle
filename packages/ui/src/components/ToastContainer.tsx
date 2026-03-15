import React, { useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  body: string;
  category: string;
  actionUrl?: string;
  createdAt: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  onAction?: (actionUrl: string) => void;
  maxVisible?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  cron: '#3b82f6',
  approval: '#10b981',
  task: '#f59e0b',
  message: '#8b5cf6',
  agent: '#6366f1',
};

export function ToastContainer({ toasts, onDismiss, onAction, maxVisible = 3 }: ToastContainerProps) {
  const visible = toasts.slice(0, maxVisible);

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {visible.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss, onAction }: {
  toast: Toast;
  onDismiss: (id: string) => void;
  onAction?: (url: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const color = CATEGORY_COLORS[toast.category] ?? '#6b7280';

  return (
    <div
      style={{
        background: '#1e1e2e',
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 280,
        maxWidth: 360,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        pointerEvents: 'auto',
        cursor: toast.actionUrl ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (toast.actionUrl && onAction) onAction(toast.actionUrl);
        onDismiss(toast.id);
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{toast.title}</div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: 14, padding: '0 4px',
          }}
        >×</button>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{toast.body}</div>
    </div>
  );
}
