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
        <div className="text-slate-500 text-xs italic">
          {MODEL_CONFIG.n_heads} heads × d_head={MODEL_CONFIG.d_head}
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
