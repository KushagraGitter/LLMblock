import React from 'react';

const BLOCK_CATEGORIES = [
  {
    label: 'Foundation',
    color: '#3b82f6',
    blocks: [
      { type: 'tokenizer',          icon: '🔤', label: 'Tokenizer' },
      { type: 'embedding',          icon: '🧮', label: 'Embedding Layer' },
      { type: 'positionalEncoding', icon: '📍', label: 'Positional Encoding' },
    ],
  },
  {
    label: 'Transformer Block',
    color: '#8b5cf6',
    blocks: [
      { type: 'transformerBlock',   icon: '🏗️', label: 'Transformer Block', data: { layerIdx: 0 } },
      { type: 'multiHeadAttention', icon: '🧠', label: 'Multi-Head Attention', data: { layerIdx: 0 } },
      { type: 'ffn',                icon: '⚡', label: 'Feed-Forward Network', data: { layerIdx: 0 } },
    ],
  },
  {
    label: 'Output',
    color: '#10b981',
    blocks: [
      { type: 'output', icon: '🎯', label: 'Linear + Softmax' },
    ],
  },
];

export default function Sidebar({ onAddNode }) {
  const onDragStart = (event, nodeType, nodeData) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ type: nodeType, data: nodeData })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      style={{
        width: 200,
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '12px 14px 8px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#475569',
          textTransform: 'uppercase',
          borderBottom: '1px solid #1e293b',
        }}
      >
        Block Palette
      </div>

      <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {BLOCK_CATEGORIES.map(cat => (
          <div key={cat.label}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: cat.color,
                textTransform: 'uppercase',
                marginBottom: 6,
                paddingLeft: 4,
              }}
            >
              {cat.label}
            </div>
            {cat.blocks.map(block => (
              <div
                key={block.type + (block.data?.layerIdx ?? '')}
                draggable
                onDragStart={(e) => onDragStart(e, block.type, block.data)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: `1px solid ${cat.color}44`,
                  background: cat.color + '11',
                  cursor: 'grab',
                  marginBottom: 4,
                  userSelect: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = cat.color + '22'}
                onMouseLeave={e => e.currentTarget.style.background = cat.color + '11'}
              >
                <span style={{ fontSize: 16 }}>{block.icon}</span>
                <span style={{ fontSize: 11, color: '#cbd5e1' }}>{block.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div
        style={{
          margin: 'auto 8px 12px',
          padding: '10px 10px',
          background: '#1e293b',
          borderRadius: 8,
          fontSize: 10,
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>How to use</div>
        <div>1. Type text in the toolbar above</div>
        <div>2. Click <b style={{ color: '#3b82f6' }}>Run</b> to process</div>
        <div>3. Click any node to inspect data</div>
        <div>4. Drag blocks from here onto the canvas</div>
      </div>
    </aside>
  );
}
