import React, { useState } from 'react';
import BaseNode from './BaseNode.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';
import useTransformerStore from '../store/useTransformerStore.js';
import { MODEL_CONFIG } from '../lib/weights.js';

const TABS = ['PE', 'Embedding + PE'];

export default function PositionalEncodingNode({ id }) {
  const { pipelineResult, tokens, hasRun } = useTransformerStore();
  const [tab, setTab] = useState(0);

  const peNorm = pipelineResult?.peNorm ?? null;
  const combined = pipelineResult?.embedWithPENorm ?? null;
  const rowLabels = tokens.map(t => t.token);

  const matrix = tab === 0 ? peNorm : combined;

  return (
    <BaseNode
      id={id}
      nodeType="positionalEncoding"
      badge={hasRun ? 'sinusoidal' : null}
      formula={`PE(pos, 2i)   = sin(pos / 10000^(2i/d))\nPE(pos, 2i+1) = cos(pos / 10000^(2i/d))\nOutput = Embed + PE`}
    >
      {!hasRun ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Mini sine wave SVG illustration */}
          <svg viewBox="0 0 220 48" style={{ width: 220, height: 48 }}>
            {[0, 1, 2].map(row => (
              <g key={row}>
                {Array.from({ length: 44 }, (_, x) => {
                  const y = Math.sin((x / 44) * Math.PI * 2 * (row + 1)) * 10 + 12 + row * 16;
                  return x > 0 ? (
                    <line key={x}
                      x1={(x - 1) * 5} y1={Math.sin(((x - 1) / 44) * Math.PI * 2 * (row + 1)) * 10 + 12 + row * 16}
                      x2={x * 5} y2={y}
                      stroke={['#818cf8', '#c084fc', '#60a5fa'][row]} strokeWidth={1.5} opacity={0.8}
                    />
                  ) : null;
                })}
              </g>
            ))}
          </svg>
          <div style={{ fontSize: 9, color: '#334155' }}>
            Each position gets a unique sine/cosine fingerprint
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Tab bar */}
          <div className="flex gap-1">
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setTab(i); }}
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === i ? '#a855f7' : '#1e293b',
                  color: tab === i ? '#fff' : '#94a3b8',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="text-slate-400 text-xs">
            {tab === 0
              ? 'PE matrix — each row encodes position with alternating sin/cos'
              : 'Embedding + PE — the model\'s actual input representation'}
          </div>

          {matrix && (
            <HeatmapGrid
              matrix={matrix}
              rowLabels={rowLabels}
              cellSize={13}
              maxRows={12}
              maxCols={MODEL_CONFIG.d_model}
              scheme="viridis"
            />
          )}
        </div>
      )}
    </BaseNode>
  );
}
