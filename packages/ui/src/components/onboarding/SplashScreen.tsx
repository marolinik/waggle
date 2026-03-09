/**
 * SplashScreen — startup progress display.
 *
 * Pure presentational component: receives phase, message, progress, and optional error.
 * No hooks or side effects — all state is driven by props.
 */

import React from 'react';

export interface SplashScreenProps {
  /** Current startup phase identifier */
  phase: string;
  /** Human-readable status message */
  message: string;
  /** Progress value from 0 to 1 */
  progress: number;
  /** Optional error message */
  error?: string;
}

export function SplashScreen({ phase, message, progress, error }: SplashScreenProps): React.ReactElement {
  const percentage = Math.round(progress * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#e0e0e0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Logo area */}
      <div
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          marginBottom: '2rem',
          letterSpacing: '0.05em',
          color: '#f5a623',
        }}
      >
        Waggle
      </div>

      {/* Phase message */}
      <div
        style={{
          fontSize: '1rem',
          marginBottom: '1.5rem',
          opacity: 0.9,
          minHeight: '1.5em',
        }}
      >
        {error ? error : message}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '300px',
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: '3px',
            background: error ? '#e74c3c' : '#f5a623',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Percentage */}
      <div
        style={{
          fontSize: '0.85rem',
          marginTop: '0.75rem',
          opacity: 0.7,
        }}
      >
        {error ? 'Error' : `${percentage}%`}
      </div>
    </div>
  );
}
