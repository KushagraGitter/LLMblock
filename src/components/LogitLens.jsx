import React from 'react';
import useTransformerStore from '../store/useTransformerStore.js';

/**
 * Logit Lens — shows the top-5 next-token predictions at each layer.
 * Inspired by the "logit lens" interpretability technique.
 */
export default function LogitLens() {
  const { logitLens, hasRun } = useTransformerStore();

  if (!hasRun || !logitLens) {
    return (
      <div style={{ padding: 20, color: '#475569', fontSize: 12, textAlign: 'center' }}>
        Run the pipeline to see how predictions evolve layer by layer.
      </div>
    );
  }

  const maxProb = Math.max(...logitLens.flatMap(l => l.top5.map(t => t.prob)));

  return (
    <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
          🔍 Logit Lens
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
          Projects the hidden state at each layer directly to vocab.
          Watch how the model's prediction shifts as it processes deeper.
        </div>
      </div>

      {logitLens.map(({ label, top5 }) => (
        <div
          key={label}
          style={{
            background: '#1e293b',
            borderRadius: 8,
            padding: '10px 12px',
            border: '1px solid #334155',
          }}
        >
          {/* Layer label */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#94a3b8',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {label}
          </div>

          {/* Top-5 tokens */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {top5.map((t, i) => {
              const barW = Math.round((t.prob / maxProb) * 140);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 56,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: i === 0 ? '#a78bfa' : '#94a3b8',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      flexShrink: 0,
                    }}
                  >
                    {t.token}
                  </span>
                  <div
                    style={{
                      height: 8,
                      width: barW,
                      background: i === 0 ? '#7c3aed' : '#1e293b',
                      borderRadius: 2,
                      border: i === 0 ? 'none' : '1px solid #334155',
                    }}
                  />
                  <span style={{ fontSize: 9, color: '#475569', marginLeft: 2 }}>
                    {(t.prob * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ fontSize: 10, color: '#334155', textAlign: 'center' }}>
        Early layers are noisy — predictions sharpen in later layers
      </div>
    </div>
  );
}
