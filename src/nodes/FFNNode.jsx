import React from 'react';
import BaseNode from './BaseNode.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';
import useTransformerStore from '../store/useTransformerStore.js';
import { MODEL_CONFIG } from '../lib/weights.js';
import { normalizeMatrix } from '../lib/mathUtils.js';

export default function FFNNode({ id, data }) {
  const { pipelineResult, tokens, hasRun } = useTransformerStore();
  const layerIdx = data?.layerIdx ?? 0;

  const blockResult = pipelineResult?.blockResults?.[layerIdx];
  const normed2 = blockResult?.intermediate?.normed2 ?? null;
  const ffnOut = blockResult?.intermediate?.ffnOut ?? null;

  const rowLabels = tokens.map(t => t.token);

  return (
    <BaseNode
      id={id}
      title="Feed-Forward Network"
      icon="⚡"
      accentColor="#f59e0b"
      badge={
        hasRun
          ? `${MODEL_CONFIG.d_model}→${MODEL_CONFIG.d_ff}→${MODEL_CONFIG.d_model}`
          : null
      }
    >
      {!hasRun ? (
        <div className="text-slate-500 text-xs italic">
          2-layer MLP with GELU — the model's "memory"
        </div>
      ) : ffnOut ? (
        <div className="flex flex-col gap-2">
          <div className="text-slate-400 text-xs">
            FFN output — post GELU activation + residual
          </div>
          <HeatmapGrid
            matrix={normalizeMatrix(ffnOut)}
            rowLabels={rowLabels}
            cellSize={13}
            maxRows={tokens.length}
            maxCols={MODEL_CONFIG.d_model}
            scheme="viridis"
          />
          <div className="text-slate-500 text-xs">
            d_model={MODEL_CONFIG.d_model} · d_ff={MODEL_CONFIG.d_ff} · GELU activation
          </div>
        </div>
      ) : (
        <div className="text-slate-500 text-xs">No data</div>
      )}
    </BaseNode>
  );
}
