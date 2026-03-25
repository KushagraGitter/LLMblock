import React, { useState } from 'react';
import BaseNode from './BaseNode.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';
import useTransformerStore from '../store/useTransformerStore.js';
import { MODEL_CONFIG } from '../lib/weights.js';
import { normalizeMatrix } from '../lib/mathUtils.js';

export default function MultiHeadAttentionNode({ id, data }) {
  const { pipelineResult, tokens, hasRun } = useTransformerStore();
  const layerIdx = data?.layerIdx ?? 0;
  const [headIdx, setHeadIdx] = useState(0);

  const blockResult = pipelineResult?.blockResults?.[layerIdx];
  const headWeights = blockResult?.headWeights ?? null;

  const rowLabels = tokens.map(t => t.token);

  return (
    <BaseNode
      id={id}
      nodeType="multiHeadAttention"
      badge={hasRun ? `Layer ${layerIdx + 1} · ${MODEL_CONFIG.n_heads} heads` : null}
      formula={`Q=xWq, K=xWk, V=xWv\nhead_h = softmax(QKᵀ/√d_k)·V\nMHA = concat(heads)·Wo`}
    >
      {!hasRun ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Mini attention concept: 3×3 grid showing high/low values */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>Attention (who looks at whom):</div>
            {[
              [0.8, 0.1, 0.1],
              [0.2, 0.7, 0.1],
              [0.05, 0.35, 0.6],
            ].map((row, r) => (
              <div key={r} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span style={{ fontSize: 8, color: '#334155', width: 20, textAlign: 'right', fontFamily: 'monospace' }}>
                  {['cat', 'sat', 'on'][r]}
                </span>
                {row.map((v, c) => (
                  <div key={c} style={{
                    width: 28, height: 14, borderRadius: 2,
                    background: `rgba(139,92,246,${v})`,
                    border: '1px solid #1e293b',
                  }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: '#334155' }}>
            {MODEL_CONFIG.n_heads} heads run in parallel · bright = high attention
          </div>
        </div>
      ) : headWeights ? (
        <div className="flex flex-col gap-2">
          {/* Head selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-xs mr-1">Head:</span>
            {headWeights.map((_, h) => (
              <button
                key={h}
                onClick={(e) => { e.stopPropagation(); setHeadIdx(h); }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 700,
                  background: h === headIdx ? '#8b5cf6' : '#1e293b',
                  color: h === headIdx ? '#fff' : '#94a3b8',
                }}
              >
                {h + 1}
              </button>
            ))}
          </div>

          <div className="text-slate-400 text-xs">
            Attention map — which tokens attend to which
          </div>

          {/* Attention heatmap (square: seq × seq) */}
          <HeatmapGrid
            matrix={normalizeMatrix(headWeights[headIdx])}
            rowLabels={rowLabels}
            colLabels={rowLabels}
            cellSize={14}
            maxRows={tokens.length}
            maxCols={tokens.length}
            scheme="viridis"
          />

          <div className="text-slate-500 text-xs">
            Row = query token · Column = key token
          </div>
        </div>
      ) : (
        <div className="text-slate-500 text-xs">No data</div>
      )}
    </BaseNode>
  );
}
