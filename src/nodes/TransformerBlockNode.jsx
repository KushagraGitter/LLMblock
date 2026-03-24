import React from 'react';
import BaseNode from './BaseNode.jsx';
import HeatmapGrid from '../components/HeatmapGrid.jsx';
import useTransformerStore from '../store/useTransformerStore.js';
import { MODEL_CONFIG } from '../lib/weights.js';
import { normalizeMatrix } from '../lib/mathUtils.js';

/**
 * Compact "Transformer Block" node that summarises the entire block
 * (LayerNorm → MHA → Residual → LayerNorm → FFN → Residual).
 */
export default function TransformerBlockNode({ id, data }) {
  const { pipelineResult, tokens, hasRun } = useTransformerStore();
  const layerIdx = data?.layerIdx ?? 0;

  const blockResult = pipelineResult?.blockResults?.[layerIdx];
  const output = blockResult?.output ?? null;
  const headWeights = blockResult?.headWeights ?? null;
  const rowLabels = tokens.map(t => t.token);

  return (
    <BaseNode
      id={id}
      title={`Transformer Block ${layerIdx + 1}`}
      icon="🏗️"
      accentColor="#8b5cf6"
      badge={hasRun ? `Layer ${layerIdx + 1}` : null}
      formula={`x₁ = x + MHA(LN(x))\nx₂ = x₁ + FFN(LN(x₁))\n(pre-norm residual)`}
    >
      {!hasRun ? (
        <div className="text-slate-500 text-xs italic">
          LN → MHA → Residual → LN → FFN → Residual
        </div>
      ) : output ? (
        <div className="flex flex-col gap-2">
          {/* Mini attention map for head 0 */}
          {headWeights && (
            <div>
              <div className="text-slate-400 text-xs mb-1">
                Attention head 1 — token alignment
              </div>
              <HeatmapGrid
                matrix={normalizeMatrix(headWeights[0])}
                rowLabels={rowLabels}
                colLabels={rowLabels}
                cellSize={12}
                maxRows={tokens.length}
                maxCols={tokens.length}
                scheme="viridis"
              />
            </div>
          )}
          {/* Block output */}
          <div className="text-slate-400 text-xs mt-1">Block output</div>
          <HeatmapGrid
            matrix={normalizeMatrix(output)}
            rowLabels={rowLabels}
            cellSize={12}
            maxRows={tokens.length}
            maxCols={MODEL_CONFIG.d_model}
            scheme="viridis"
          />
        </div>
      ) : (
        <div className="text-slate-500 text-xs">No data</div>
      )}
    </BaseNode>
  );
}
