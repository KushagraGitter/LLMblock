import React, { useState } from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import { MODEL_PRESETS, countParams } from '../lib/weights.js';
import { VOCAB_SIZE } from '../lib/tokenizer.js';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/**
 * Architecture configurator modal.
 * Lets the user pick a preset or manually tune d_model, n_heads, n_layers.
 */
export default function ArchModal() {
  const { showArchModal, setShowArchModal, modelConfig, setModelConfig, paramCount } = useTransformerStore();

  const [draft, setDraft] = useState(() => ({ ...modelConfig }));

  if (!showArchModal) return null;

  const draftParams = countParams({ ...draft, vocab_size: VOCAB_SIZE });

  const applyPreset = (preset) => {
    setDraft({ ...MODEL_PRESETS[preset], vocab_size: VOCAB_SIZE });
  };

  const handleApply = () => {
    setModelConfig(draft);
    setShowArchModal(false);
  };

  // Ensure n_heads divides d_model
  const updateDModel = (val) => {
    const d = parseInt(val);
    const validHeads = [1, 2, 4, 8].filter(h => d % h === 0);
    const heads = validHeads.includes(draft.n_heads) ? draft.n_heads : validHeads[validHeads.length - 1] ?? 1;
    setDraft(s => ({ ...s, d_model: d, d_ff: d * 4, n_heads: heads }));
  };

  const DMODELS = [16, 32, 64, 128];
  const NLAYERS = [1, 2, 3, 4];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,6,23,0.8)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setShowArchModal(false)}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 16,
          padding: 24,
          width: 420,
          boxShadow: '0 24px 64px #00000080',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Architecture</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowArchModal(false)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}
          >×</button>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Presets
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(MODEL_PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 8,
                  border: `1px solid ${draft.d_model === p.d_model && draft.n_layers === p.n_layers ? '#6366f1' : '#1e293b'}`,
                  background: draft.d_model === p.d_model && draft.n_layers === p.n_layers ? '#6366f122' : '#1e293b',
                  color: draft.d_model === p.d_model && draft.n_layers === p.n_layers ? '#818cf8' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                <div>{p.label}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{fmt(countParams({ ...p, vocab_size: VOCAB_SIZE }))} params</div>
              </button>
            ))}
          </div>
        </div>

        {/* d_model */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>d_model <span style={{ color: '#64748b', fontSize: 10 }}>(embedding dim)</span></span>
            <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700 }}>{draft.d_model}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DMODELS.map(v => (
              <button
                key={v}
                onClick={() => updateDModel(v)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: draft.d_model === v ? '#6366f1' : '#1e293b',
                  color: draft.d_model === v ? '#fff' : '#94a3b8',
                  fontSize: 12, fontWeight: 700,
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* n_heads */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>n_heads <span style={{ color: '#64748b', fontSize: 10 }}>(attention heads)</span></span>
            <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700 }}>{draft.n_heads}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 4, 8].filter(h => draft.d_model % h === 0).map(v => (
              <button
                key={v}
                onClick={() => setDraft(s => ({ ...s, n_heads: v }))}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: draft.n_heads === v ? '#8b5cf6' : '#1e293b',
                  color: draft.n_heads === v ? '#fff' : '#94a3b8',
                  fontSize: 12, fontWeight: 700,
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* n_layers */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>n_layers <span style={{ color: '#64748b', fontSize: 10 }}>(transformer blocks)</span></span>
            <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700 }}>{draft.n_layers}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {NLAYERS.map(v => (
              <button
                key={v}
                onClick={() => setDraft(s => ({ ...s, n_layers: v }))}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: draft.n_layers === v ? '#10b981' : '#1e293b',
                  color: draft.n_layers === v ? '#fff' : '#94a3b8',
                  fontSize: 12, fontWeight: 700,
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            background: '#1e293b', borderRadius: 8, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12,
          }}
        >
          {[
            ['d_ff (4×)', draft.d_model * 4],
            ['d_head', draft.d_model / draft.n_heads],
            ['Params', fmt(draftParams)],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#475569', fontSize: 10, marginBottom: 2 }}>{label}</div>
              <div style={{ color: '#f1f5f9', fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Apply */}
        <button
          onClick={handleApply}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em',
          }}
        >
          Apply Architecture
        </button>
      </div>
    </div>
  );
}
