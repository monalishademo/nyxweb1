'use client';

import React, { useState, useRef, useEffect } from 'react';
import BackButton from '../BackButton';

type Mode = 'tts' | 'stt';

export default function TextToSpeechTool({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>('tts');

  // TTS state
  const [ttsText, setTtsText] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // STT state
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttSupported, setSttSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices() || [];
      setVoices(v);
      if (v.length > 0 && !selectedVoice) setSelectedVoice(v[0].name);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setTranscript(finalText);
    };

    recognition.onerror = (event: any) => {
      setErrorMessage(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const speak = () => {
    if (!ttsText.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    setErrorMessage(null);
    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '650px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🎙️</span> Text ⇄ Speech
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Convert text to spoken audio, or speech to text — right in your browser.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        <button
          onClick={() => setMode('tts')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: mode === 'tts' ? '2px solid #db2777' : '1px solid #cbd5e1', background: mode === 'tts' ? '#fce7f3' : 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🔊 Text to Speech
        </button>
        <button
          onClick={() => setMode('stt')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: mode === 'stt' ? '2px solid #db2777' : '1px solid #cbd5e1', background: mode === 'stt' ? '#fce7f3' : 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🎤 Speech to Text
        </button>
      </div>

      {mode === 'tts' ? (
        <div>
          <textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Type something to hear it out loud..."
            rows={5}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', marginBottom: '15px', resize: 'vertical' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Speed: {rate.toFixed(1)}x</label>
              <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            {!isSpeaking ? (
              <button onClick={speak} style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#db2777', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                🔊 Speak
              </button>
            ) : (
              <button onClick={stopSpeaking} style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#64748b', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                ⏹ Stop
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {!sttSupported && (
            <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', fontWeight: '600' }}>
              ❌ Speech recognition isn't supported in this browser. Try Chrome or Edge.
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', fontWeight: '600' }}>
              ❌ {errorMessage}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {!isListening ? (
              <button
                onClick={startListening}
                disabled={!sttSupported}
                style={{ padding: '14px 32px', borderRadius: '8px', border: 'none', background: '#db2777', color: 'white', fontWeight: 'bold', cursor: sttSupported ? 'pointer' : 'not-allowed', fontSize: '15px', opacity: sttSupported ? 1 : 0.5 }}
              >
                🎤 Start Listening
              </button>
            ) : (
              <button onClick={stopListening} style={{ padding: '14px 32px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                ⏹ Stop Listening {isListening && '(listening...)'}
              </button>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your speech will appear here..."
            rows={6}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', marginBottom: '15px', resize: 'vertical' }}
          />

          {transcript && (
            <div style={{ textAlign: 'center' }}>
              <button onClick={copyTranscript} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                📋 Copy Text
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
