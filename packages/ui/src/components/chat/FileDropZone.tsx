/**
 * FileDropZone — visual overlay when files are dragged over the chat input.
 *
 * Wraps children and activates a translucent drop indicator on dragover.
 * Calls `onDrop` with categorized DroppedFile[] on drop.
 */

import React, { useState, useCallback, useRef } from 'react';
import { categorizeFile, type DroppedFile } from './drop-utils.js';

export interface FileDropZoneProps {
  /** Called with categorized files when user drops files. */
  onDrop: (files: DroppedFile[]) => void;
  /** Disable the drop zone (e.g. while agent is thinking). */
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onDrop, disabled, children }) => {
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounter.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setDragActive(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      dragCounter.current = 0;
      if (disabled) return;

      const fileList = e.dataTransfer.files;
      if (!fileList || fileList.length === 0) return;

      const dropped: DroppedFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        dropped.push(categorizeFile(f.name, f.size));
      }
      onDrop(dropped);
    },
    [disabled, onDrop],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {children}
      {dragActive && (
        <div
          data-testid="drop-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(99, 102, 241, 0.12)',
            border: '2px dashed rgba(99, 102, 241, 0.6)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#6366f1', fontWeight: 600, fontSize: 14 }}>
            Drop files here
          </span>
        </div>
      )}
    </div>
  );
};
