'use client';

import React from 'react';

export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        background: '#0f172a',
        color: '#ffffff',
        cursor: 'pointer',
        marginBottom: '20px',
        fontWeight: '600',
        fontSize: '14px',
      }}
    >
      ← Back to Dashboard
    </button>
  );
}