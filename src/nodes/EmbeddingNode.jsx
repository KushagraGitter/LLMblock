import React from 'react';
import BaseNode from './BaseNode.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';
import useTransformerStore from '../store/useTransformerStore.js';
import { MODEL_CONFIG } from '../lib/weights.js';

export default function EmbeddingNode({ id }) {
  const { pipelineResult, tokens, hasRun } = useTransformerStore();

  const matrix = pipelineResult?.embedNorm ?? null;
  const rowLabels = tokens.map(t => t.token);

  return (
    <BaseNode
      id={id}
      nodeType="embedding"
      badge={hasRun ? `${tokens.length} × ${MODEL_CONFIG.d_model}` : null}
      formula={`E = W_embed[token_ids]\nshape: (seq_len × d_model)`}
    >
      {!hasRun ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>ID 42</span>
            <span style={{ color: '#334155' }}>→</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0.8, -0.3, 0.5, -0.7, 0.2, 0.9, -0.1, 0.4].map((v, i) => (
                <div key={i} style={{
                  width: 8, height: 28, borderRadius: 2,
                  background: v > 0 ? `rgba(129,140,248,${v})` : `rgba(248,113,113,${-v})`,
                  marginTop: v < 0 ? 0 : undefined,
                }} />
              ))}
              <span style={{ fontSize: 9, color: '#334155', alignSelf: 'center', marginLeft: 2 }}>…</span>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#334155' }}>
            Each token ID → a {MODEL_CONFIG.d_model}-dim meaning vector
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-slate-400 text-xs">
            Token embedding matrix — each row is a vector in ℝ<sup>{MODEL_CONFIG.d_model}</sup>
          </div>
          <HeatmapGrid
            matrix={matrix}
            rowLabels={rowLabels}
            cellSize={13}
            maxRows={12}
            maxCols={MODEL_CONFIG.d_model}
          />
        </div>
      )}
    </BaseNode>
  );
}
