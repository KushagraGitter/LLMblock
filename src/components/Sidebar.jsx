import React, { useState } from 'react';
import { EXPLANATIONS } from '../data/blockExplanations.js';
import useTransformerStore from '../store/useTransformerStore.js';

const BLOCK_CATALOGUE = [
  {
    category: 'Foundation',
    desc: 'Prepare text for the model',
    color: '#3b82f6',
    blocks: [
      { type: 'tokenizer',          data: {} },
      { type: 'embedding',          data: {} },
      { type: 'positionalEncoding', data: {} },
    ],
  },
  {
    category: 'Transformer Block',
    desc: 'Core processing unit',
    color: '#8b5cf6',
    blocks: [
      { type: 'transformerBlock',   data: { layerIdx: 0 } },
      { type: 'multiHeadAttention', data: { layerIdx: 0 } },
      { type: 'ffn',                data: { layerIdx: 0 } },
    ],
  },
  {
    category: 'Output',
    desc: 'Generate predictions',
    color: '#10b981',
    blocks: [
      { type: 'output', data: {} },
    ],
  },
];

function BlockCard({ type, data }) {
  const [hovered, setHovered] = useState(false);
  const exp = EXPLANATIONS[type] ?? {};

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ type, data }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? exp.color : exp.color + '44'}`,
        borderRadius: 10,
        background: hovered ? exp.color + '18' : exp.color + '0b',
        padding: '10px 11px',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'all 0.15s',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <span style={{ fontSize: 18 }}>{exp.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: exp.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {exp.displayTitle}
        </span>
      </div>

      <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.45, marginBottom: 7 }}>
        {exp.tagline}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#475569' }}>
        <span style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#64748b' }}>
          {exp.inputLabel}
        </span>
        <span style={{ color: '#334155' }}>→</span>
        <span style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#64748b' }}>
          {exp.outputLabel}
        </span>
      </div>

      {hovered && (
        <div style={{ marginTop: 7, fontSize: 9, color: exp.color + 'aa', textAlign: 'right', letterSpacing: '0.04em' }}>
          ⊕ drag onto canvas
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { setShowOnboarding, setTourHighlightId } = useTransformerStore();

  return (
    <aside
      style={{
        width: 215,
        background: '#0a0f1e',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>
          Block Palette
        </div>
        <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.4 }}>
          Drag blocks onto the canvas to build your model
        </div>
      </div>

      <div style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
        {BLOCK_CATALOGUE.map(cat => (
          <div key={cat.category} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingLeft: 2 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: cat.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {cat.category}
                </div>
                <div style={{ fontSize: 9, color: '#334155' }}>{cat.desc}</div>
              </div>
            </div>
            {cat.blocks.map(b => (
              <BlockCard key={b.type} type={b.type} data={b.data} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1e293b', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={() => { setShowOnboarding(true); setTourHighlightId(null); }}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: '1px solid #6366f144', background: '#6366f10d',
            color: '#818cf8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >
          🎓 Guided Tour
        </button>

        <div style={{ background: '#1e293b', borderRadius: 8, padding: '9px 10px', fontSize: 10, color: '#475569', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 3 }}>Quick start</div>
          <div>1. Hit <b style={{ color: '#3b82f6' }}>▶ Run</b> to process text</div>
          <div>2. Click a block, open <b style={{ color: '#fbbf24' }}>📖 Explain It</b></div>
          <div>3. Try <b style={{ color: '#a78bfa' }}>🎲 Generate</b> to watch it write</div>
        </div>
      </div>
    </aside>
  );
}
