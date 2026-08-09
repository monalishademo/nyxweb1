'use client';

import React from 'react';
import Link from 'next/link';

interface AppHeaderProps {
  onGoHome?: () => void;
}

export default function AppHeader({ onGoHome }: AppHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between', // <--- সঠিক CSS Property
        alignItems: 'center',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '15px 0',
      }}
    >
      {/* Brand Title */}
      <h1
        style={{ color: '#0070f3', fontSize: '26px', margin: 0, cursor: 'pointer' }}
        onClick={onGoHome}
      >
        <b>NyxWeb1</b> Hub
      </h1>

      {/* Navigation Buttons */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onGoHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#334155',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '5px 10px',
          }}
        >
          PDF Tools
        </button>

        <button
          onClick={onGoHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#334155',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '5px 10px',
          }}
        >
          Convert Tools
        </button>

        <button
          onClick={onGoHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#334155',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '5px 10px',
          }}
        >
          Image Tools
        </button>

        {/* Secure Admin Portal Link Button */}
        <Link
          href="/login"
          style={{
            textDecoration: 'none',
            color: '#0070f3',
            fontWeight: 'bold',
            padding: '6px 14px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '14px',
          }}
        >
          Admin Zone 
        </Link>
      </nav>
    </header>
  );
}