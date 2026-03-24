import React from 'react';
import useTransformerStore from '../store/useTransformerStore.js';

/**
 * Autoregressive generation panel — shown at the bottom of the screen.
 * Shows the prompt, generated tokens appearing one by one, and controls.
 */
export default function GenerationPanel() {
  const {
    showGenPanel, setShowGenPanel,
    isGenerating, generate, stopGeneration,
    generatedTokens, inputText, setInputText,
    temperature, setTemperature,
    maxGenTokens, setMaxGenTokens,
    topTokens,
  } = useTransformerStore();

  if (!showGenPanel) return null;

  // Split inputText into original prompt and generated portion
  const genWords = generatedTokens.map(t => t.token);
  const promptPart = inputText
    .split(' ')
    .slice(0, inputText.split(' ').length - genWords.length)
    .join(' ');

  const handleReset = () => {
    stopGeneration();
    // Strip generated tokens from inputText
    const originalWords = inputText.split(' ').slice(0, inputText.split(' ').length - generatedTokens.length);
    setInputText(originalWords.join(' '));
    useTransformerStore.setState({ generatedTokens: [] });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 200,   // after sidebar
        right: 0,
        background: '#0f172a',
        borderTop: '1px solid #1e293b',
        zIndex: 50,
        boxShadow: '0 -8px 32px #00000060',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <span style={{ fontSize: 14 }}>🎲</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Generation
        </span>

        {/* Temperature */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>Temp</span>
          <input
            type="range" min="0.1" max="2" step="0.05"
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            style={{ width: 80, accentColor: '#a78bfa' }}
          />
          <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 28 }}>{temperature.toFixed(2)}</span>
        </div>

        {/* Max tokens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>Max tokens</span>
          <input
            type="range" min="1" max="40" step="1"
            value={maxGenTokens}
            onChange={e => setMaxGenTokens(parseInt(e.target.value))}
            style={{ width: 70, accentColor: '#a78bfa' }}
          />
          <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 20 }}>{maxGenTokens}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Controls */}
        {!isGenerating ? (
          <button
            onClick={generate}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            ▶ Generate
          </button>
        ) : (
          <button
            onClick={stopGeneration}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: '#ef4444',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            ⏹ Stop
          </button>
        )}

        <button
          onClick={handleReset}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid #334155',
            cursor: 'pointer',
            background: 'none',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          ↺ Reset
        </button>

        <button
          onClick={() => { stopGeneration(); setShowGenPanel(false); }}
          style={{
            background: 'none', border: 'none', color: '#475569',
            cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Generated text display */}
      <div style={{ padding: '12px 16px', minHeight: 60 }}>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 14,
            lineHeight: 1.8,
            color: '#cbd5e1',
            flexWrap: 'wrap',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          {/* Prompt */}
          <span style={{ color: '#64748b' }}>{promptPart || inputText.split(' ').slice(0, -generatedTokens.length).join(' ') || inputText}</span>

          {/* Generated tokens */}
          {generatedTokens.map((t, i) => (
            <span
              key={i}
              title={`p = ${(t.prob * 100).toFixed(2)}%`}
              style={{
                background: `rgba(167, 139, 250, ${0.15 + t.prob * 0.4})`,
                color: '#a78bfa',
                borderRadius: 4,
                padding: '1px 4px',
                fontSize: 14,
                border: '1px solid rgba(167,139,250,0.3)',
                animation: i === generatedTokens.length - 1 ? 'fadeIn 0.2s ease' : 'none',
              }}
            >
              {t.token}
            </span>
          ))}

          {/* Blinking cursor while generating */}
          {isGenerating && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: 16,
                background: '#a78bfa',
                borderRadius: 1,
                animation: 'blink 0.8s step-end infinite',
                verticalAlign: 'middle',
                marginLeft: 2,
              }}
            />
          )}
        </div>

        {/* Step info */}
        {generatedTokens.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: '#475569' }}>
            Generated {generatedTokens.length} token{generatedTokens.length !== 1 ? 's' : ''}.
            {' '}Last: <span style={{ color: '#a78bfa' }}>{generatedTokens[generatedTokens.length - 1]?.token}</span>
            {' '}(p={((generatedTokens[generatedTokens.length - 1]?.prob ?? 0) * 100).toFixed(1)}%)
            {topTokens[0] && ` · Top alternative: "${topTokens[0].token}" (${(topTokens[0].prob * 100).toFixed(1)}%)`}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
