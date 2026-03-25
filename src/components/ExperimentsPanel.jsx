import React from 'react';
import useTransformerStore from '../store/useTransformerStore.js';

const EXPERIMENTS = [
  {
    id: 'skipPositionalEncoding',
    icon: '📍',
    label: 'Remove Positional Encoding',
    colour: '#c084fc',
    whatBreaks: 'The model loses all sense of word order.',
    detail:
      '"Dog bites man" and "Man bites dog" become identical inputs. Watch the output ' +
      'distribution become symmetric — the model can no longer use position to disambiguate.',
    warning: 'Output entropy rises; token order stops mattering.',
  },
  {
    id: 'skipResidual',
    icon: '🔗',
    label: 'Remove Residual Connections',
    colour: '#f59e0b',
    whatBreaks: 'Gradients vanish. Deep models become untrainable.',
    detail:
      'Without residual shortcuts, the signal must pass through every layer in series. ' +
      'Each layer can only overwrite — not refine — the previous one. ' +
      'Attention patterns stop composing across layers.',
    warning: 'Outputs collapse or become uniform with many layers.',
  },
  {
    id: 'skipLayerNorm',
    icon: '⚖️',
    label: 'Remove Layer Normalization',
    colour: '#ef4444',
    whatBreaks: 'Activations explode or vanish. Training diverges.',
    detail:
      'LayerNorm keeps the residual stream at a controlled scale. Without it, ' +
      'values can grow exponentially through layers. The output distribution ' +
      'typically becomes extremely peaked (one token gets near-100% probability).',
    warning: 'Distribution becomes degenerate — one token dominates.',
  },
];

function Toggle({ checked, onChange, colour }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: checked ? colour : '#1e293b',
        border: `1px solid ${checked ? colour : '#334155'}`,
        position: 'relative', transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 8,
        background: '#fff', position: 'absolute',
        top: 2, left: checked ? 20 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px #00000060',
      }} />
    </div>
  );
}

export default function ExperimentsPanel() {
  const { ablation, setAblation, modelConfig, hasRun, topTokens } = useTransformerStore();
  const anyActive = ablation.skipPositionalEncoding || ablation.skipResidual || ablation.skipLayerNorm || ablation.maskedHeads.size > 0;

  const toggle = (id) => {
    setAblation({ [id]: !ablation[id] });
  };

  const toggleHead = (h) => {
    const next = new Set(ablation.maskedHeads);
    if (next.has(h)) next.delete(h); else next.add(h);
    setAblation({ maskedHeads: next });
  };

  const reset = () => setAblation({
    skipPositionalEncoding: false,
    skipResidual: false,
    skipLayerNorm: false,
    maskedHeads: new Set(),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>
            🔬 Break the Model
          </div>
          {anyActive && (
            <button onClick={reset} style={{
              padding: '3px 10px', borderRadius: 5,
              border: '1px solid #334155', background: 'none',
              color: '#64748b', fontSize: 10, cursor: 'pointer',
            }}>
              Reset all
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginTop: 4 }}>
          Toggle components off to see what they actually do. Each experiment re-runs the pipeline instantly.
          {!hasRun && <span style={{ color: '#f59e0b' }}> Hit ▶ Run first.</span>}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

        {/* Component toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {EXPERIMENTS.map(exp => {
            const on = ablation[exp.id];
            return (
              <div
                key={exp.id}
                style={{
                  border: `1px solid ${on ? exp.colour : '#1e293b'}`,
                  borderRadius: 10, padding: '10px 12px',
                  background: on ? exp.colour + '12' : '#0f172a',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: on ? 8 : 0 }}>
                  <span style={{ fontSize: 18 }}>{exp.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: on ? exp.colour : '#94a3b8' }}>
                      {exp.label}
                    </div>
                    {!on && (
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{exp.whatBreaks}</div>
                    )}
                  </div>
                  <Toggle checked={on} onChange={() => toggle(exp.id)} colour={exp.colour} />
                </div>

                {on && (
                  <>
                    <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 8px' }}>
                      {exp.detail}
                    </p>
                    <div style={{
                      background: exp.colour + '15', borderRadius: 6,
                      padding: '6px 9px', fontSize: 10, color: exp.colour,
                      borderLeft: `2px solid ${exp.colour}`,
                    }}>
                      ⚠ {exp.warning}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Head masking */}
        <div style={{
          border: '1px solid #1e293b', borderRadius: 10, padding: '10px 12px',
          background: '#0f172a', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            👁 Mask Attention Heads
          </div>
          <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>
            Zero-out individual heads to see which ones matter. Each head learns different patterns.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: modelConfig.n_heads }, (_, h) => {
              const masked = ablation.maskedHeads.has(h);
              return (
                <button
                  key={h}
                  onClick={() => toggleHead(h)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: masked ? '#ef4444' : '#1e293b',
                    color: masked ? '#fff' : '#94a3b8',
                    textDecoration: masked ? 'line-through' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  H{h + 1}
                </button>
              );
            })}
          </div>
          {ablation.maskedHeads.size > 0 && (
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 6 }}>
              {ablation.maskedHeads.size} head{ablation.maskedHeads.size > 1 ? 's' : ''} zeroed out
            </div>
          )}
        </div>

        {/* Live output preview when experiments active */}
        {anyActive && hasRun && topTokens.length > 0 && (
          <div style={{ border: '1px solid #334155', borderRadius: 10, padding: '10px 12px', background: '#0f172a' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Modified output — top 5 predictions
            </div>
            {topTokens.slice(0, 5).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#475569', fontSize: 10, width: 16, textAlign: 'right' }}>#{i + 1}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: i === 0 ? '#10b981' : '#94a3b8', width: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.token}
                </span>
                <div style={{ height: 8, width: Math.round((t.prob / (topTokens[0]?.prob || 1)) * 100), background: i === 0 ? '#10b981' : '#1e293b', borderRadius: 2, border: '1px solid #334155' }} />
                <span style={{ fontSize: 9, color: '#475569' }}>{(t.prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
