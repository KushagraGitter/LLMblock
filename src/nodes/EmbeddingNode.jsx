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
      title="Embedding Layer"
      icon="🧮"
      accentColor="#6366f1"
      badge={hasRun ? `${tokens.length} × ${MODEL_CONFIG.d_model}` : null}
    >
      {!hasRun ? (
        <div className="text-slate-500 text-xs italic">
          Maps token IDs → {MODEL_CONFIG.d_model}-dim vectors
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
