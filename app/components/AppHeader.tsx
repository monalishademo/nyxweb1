'use client';

import React from 'react';

interface AppHeaderProps {
  onGoHome: () => void;
}

export default function AppHeader({ onGoHome }: AppHeaderProps) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto', padding: '15px 0' }}>
      <h1
        style={{ color: '#0070f3', fontSize: '26px', margin: 0, cursor: 'pointer' }}
        onClick={onGoHome}
      >
        <b>NyxWeb1</b> Hub
      </h1>
      <nav>
        <button onClick={onGoHome} style={{ background: 'none', border: 'none', color: '#334155', fontWeight: '500', cursor: 'pointer', margin: '0 10px' }}>PDF Tools</button>
        <button onClick={onGoHome} style={{ background: 'none', border: 'none', color: '#334155', fontWeight: '500', cursor: 'pointer', margin: '0 10px' }}>Convert Tools</button>
        <button onClick={onGoHome} style={{ background: 'none', border: 'none', color: '#334155', fontWeight: '500', cursor: 'pointer', margin: '0 10px' }}>Image Tools</button>
        <button onClick={onGoHome} style={{ background: 'none', border: 'none', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', margin: '0 10px' }}>Admin Zone 🔒</button>
      </nav>
    </header>
  );
}
