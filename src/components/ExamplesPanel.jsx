import React, { useState } from 'react';
import { FAMOUS_EXAMPLES } from '../data/famousExamples.js';
import useTransformerStore from '../store/useTransformerStore.js';

export default function ExamplesPanel() {
  const { setInputText, run } = useTransformerStore();
  const [active, setActive] = useState(null);

  const load = (ex) => {
    setActive(ex.id);
    setInputText(ex.sentence);
    setTimeout(run, 60);
  };

  const current = FAMOUS_EXAMPLES.find(e => e.id === active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          📚 Famous Examples
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
          Sentences chosen to reveal specific transformer behaviours.
          Click one to load it and run the pipeline.
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Example buttons */}
        {FAMOUS_EXAMPLES.map(ex => (
          <button
            key={ex.id}
            onClick={() => load(ex)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${active === ex.id ? ex.colour : ex.colour + '44'}`,
              background: active === ex.id ? ex.colour + '18' : ex.colour + '0a',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{ex.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: ex.colour, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {ex.concept}
              </span>
            </div>
            <div style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 11,
              color: '#94a3b8', background: '#1e293b',
              padding: '5px 8px', borderRadius: 5,
              lineHeight: 1.4,
            }}>
              "{ex.sentence}"
            </div>
          </button>
        ))}

        {/* Explanation card for active example */}
        {current && (
          <div style={{
            marginTop: 4,
            background: '#0f172a',
            border: `1px solid ${current.colour}44`,
            borderRadius: 12,
            padding: '14px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>{current.icon}</span>
              <div style={{ fontSize: 12, fontWeight: 800, color: current.colour }}>
                {current.concept}
              </div>
            </div>

            {/* Spotlight tokens */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#475569' }}>KEY LINK:</span>
              {current.spotlight.map((w, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color: '#334155', fontSize: 14 }}>→</span>}
                  <span style={{
                    background: current.colour + '25',
                    border: `1px solid ${current.colour}55`,
                    borderRadius: 4, padding: '2px 8px',
                    fontSize: 11, color: current.colour,
                    fontFamily: 'monospace', fontWeight: 700,
                  }}>
                    {w}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* What a trained model does */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                What a trained model does
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.65, margin: 0 }}>
                {current.explanation}
              </p>
            </div>

            {/* What to look for NOW */}
            <div style={{
              background: '#1e293b', borderRadius: 8,
              padding: '10px 12px', fontSize: 11,
              color: '#94a3b8', lineHeight: 1.6,
              borderLeft: `3px solid ${current.colour}`,
            }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                👁 What to look for
              </div>
              {current.lookFor}
            </div>

            {/* Disclaimer */}
            <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5 }}>
              ⚠ Our demo uses random weights — patterns are illustrative, not semantically meaningful.
              With trained GPT-2 weights these exact attention links would appear.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
