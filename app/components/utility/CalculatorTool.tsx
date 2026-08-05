'use client';

import React, { useState } from 'react';
import BackButton from '../BackButton';

interface Note {
  id: string;
  text: string;
  time: string;
}

export default function CalculatorTool({ onBack }: { onBack: () => void }) {
  const [display, setDisplay] = useState<string>('0');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');

  const handleBtnClick = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleDelete = () => {
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleCalculate = () => {
    try {
      // Safe math evaluation
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
      const res = eval(sanitized);
      setDisplay(String(Number(res.toFixed(8))));
    } catch {
      setDisplay('Error');
    }
  };

  const handleAddNote = () => {
    if (!currentNote.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: currentNote,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotes([newNote, ...notes]);
    setCurrentNote('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '950px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🧮</span> Scientific Calculator & Quick Notes
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Perform fast calculations and save quick notes or history instantly.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* Calculator Block */}
        <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          {/* Display Display */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', color: '#38bdf8', fontSize: '32px', fontWeight: 'bold', textAlign: 'right', marginBottom: '20px', minHeight: '40px', wordBreak: 'break-all' }}>
            {display}
          </div>

          {/* Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {['C', '⌫', '(', ')'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === '⌫') handleDelete();
                  else handleBtnClick(btn);
                }}
                style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: '#334155', color: '#f8fafc', cursor: 'pointer' }}
              >
                {btn}
              </button>
            ))}

            {['7', '8', '9', '÷'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '÷' ? handleBtnClick('/') : handleBtnClick(btn))}
                style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: btn === '÷' ? '#0284c7' : '#1e293b', color: '#ffffff', cursor: 'pointer' }}
              >
                {btn}
              </button>
            ))}

            {['4', '5', '6', '×'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '×' ? handleBtnClick('*') : handleBtnClick(btn))}
                style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: btn === '×' ? '#0284c7' : '#1e293b', color: '#ffffff', cursor: 'pointer' }}
              >
                {btn}
              </button>
            ))}

            {['1', '2', '3', '-'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleBtnClick(btn)}
                style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: btn === '-' ? '#0284c7' : '#1e293b', color: '#ffffff', cursor: 'pointer' }}
              >
                {btn}
              </button>
            ))}

            {['0', '.', '=', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === '=') handleCalculate();
                  else handleBtnClick(btn);
                }}
                style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: btn === '=' ? '#16a34a' : btn === '+' ? '#0284c7' : '#1e293b', color: '#ffffff', cursor: 'pointer' }}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Block */}
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '18px' }}>📝 Quick Scratchpad & Notes</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Save calculation note..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
            />
            <button
              onClick={handleAddNote}
              style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notes.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '30px' }}>No notes saved yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{note.text}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{note.time}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}