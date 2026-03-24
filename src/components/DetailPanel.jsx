import React from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import HeatmapGrid from './HeatmapGrid.jsx';
import { MODEL_CONFIG } from '../lib/weights.js';
import { normalizeMatrix } from '../lib/mathUtils.js';

/**
 * Slide-in right panel showing detailed information about the selected node.
 */
export default function DetailPanel() {
  const {
    selectedNodeId,
    setSelectedNodeId,
    pipelineResult,
    tokens,
    topTokens,
    hasRun,
    selectedLayerIdx,
    setSelectedLayerIdx,
    selectedHead,
    setSelectedHead,
  } = useTransformerStore();

  if (!selectedNodeId || !hasRun) return null;

  const rowLabels = tokens.map(t => t.token);
  const blockResult = pipelineResult?.blockResults?.[selectedLayerIdx];

  const renderContent = () => {
    if (selectedNodeId?.startsWith('tokenizer')) {
      return (
        <div className="flex flex-col gap-4">
          <h3 className="text-blue-400 font-bold text-sm">Tokenizer Details</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Raw text is split on whitespace and punctuation. Each word is mapped to
            a unique integer ID from the vocabulary. Unknown words become{' '}
            <code className="text-yellow-400">&lt;UNK&gt;</code>.
          </p>
          <div className="flex flex-col gap-1">
            {tokens.map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 w-4 text-right">{i}</span>
                <span className="text-slate-200 font-mono w-24 truncate">{t.original || t.token}</span>
                <span className="text-blue-400 font-mono">→ "{t.token}"</span>
                <span className="text-slate-500 ml-auto">ID: {t.id}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedNodeId?.startsWith('embedding')) {
      return (
        <div className="flex flex-col gap-4">
          <h3 className="text-indigo-400 font-bold text-sm">Embedding Matrix</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Each token ID indexes into a learned embedding table to get a{' '}
            {MODEL_CONFIG.d_model}-dimensional vector. These vectors encode semantic
            meaning learned during training.
          </p>
          <HeatmapGrid
            matrix={pipelineResult.embedNorm}
            rowLabels={rowLabels}
            cellSize={14}
            maxCols={MODEL_CONFIG.d_model}
          />
          <p className="text-slate-500 text-xs">
            Rows = tokens · Cols = embedding dimensions (d_model={MODEL_CONFIG.d_model})
          </p>
        </div>
      );
    }

    if (selectedNodeId?.startsWith('positional')) {
      return (
        <div className="flex flex-col gap-4">
          <h3 className="text-purple-400 font-bold text-sm">Positional Encoding</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Sinusoidal encoding: PE(pos, 2i) = sin(pos / 10000^(2i/d_model)),
            PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model)). Added to embeddings.
          </p>
          <div>
            <div className="text-xs text-slate-500 mb-2">Positional Encoding</div>
            <HeatmapGrid matrix={pipelineResult.peNorm} rowLabels={rowLabels} cellSize={14} />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Embedding + PE (model input)</div>
            <HeatmapGrid matrix={pipelineResult.embedWithPENorm} rowLabels={rowLabels} cellSize={14} />
          </div>
        </div>
      );
    }

    if (selectedNodeId?.startsWith('mha') || selectedNodeId?.startsWith('transformerBlock')) {
      const hw = blockResult?.headWeights;
      if (!hw) return <div className="text-slate-500 text-xs">No attention data</div>;

      return (
        <div className="flex flex-col gap-4">
          <h3 className="text-violet-400 font-bold text-sm">Attention Maps</h3>

          {/* Layer selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Layer:</span>
            {pipelineResult.blockResults.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedLayerIdx(i)}
                style={{
                  padding: '2px 10px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  background: selectedLayerIdx === i ? '#8b5cf6' : '#1e293b',
                  color: selectedLayerIdx === i ? '#fff' : '#94a3b8',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Each head independently computes attention scores showing which tokens
            "attend to" which. Bright cells = high attention weight.
          </p>

          {/* Head grid */}
          <div className="grid grid-cols-2 gap-3">
            {hw.map((weights, h) => (
              <div key={h} className="flex flex-col gap-1">
                <div className="text-xs text-violet-300">Head {h + 1}</div>
                <HeatmapGrid
                  matrix={normalizeMatrix(weights)}
                  rowLabels={rowLabels}
                  colLabels={rowLabels}
                  cellSize={Math.max(8, Math.floor(120 / tokens.length))}
                  maxRows={tokens.length}
                  maxCols={tokens.length}
                  scheme="viridis"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedNodeId?.startsWith('ffn')) {
      const ffnOut = blockResult?.intermediate?.ffnOut;
      return (
        <div className="flex flex-col gap-4">
          <h3 className="text-amber-400 font-bold text-sm">Feed-Forward Network</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Two linear layers with GELU activation: x → W₁x + b₁ → GELU → W₂x + b₂.
            d_model={MODEL_CONFIG.d_model} → d_ff={MODEL_CONFIG.d_ff} → d_model={MODEL_CONFIG.d_model}.
          </p>
          {ffnOut && (
            <HeatmapGrid
              matrix={normalizeMatrix(ffnOut)}
              rowLabels={rowLabels}
              cellSize={14}
              maxCols={MODEL_CONFIG.d_model}
            />
          )}
        </div>
      );
    }

    if (selectedNodeId?.startsWith('output')) {
      return (
        <div className="flex flex-col gap-4">
          <h3 className="text-emerald-400 font-bold text-sm">Output Probabilities</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            The final hidden state of the last token is projected through a linear layer
            to vocab_size logits, then softmax converts to probabilities.
          </p>
          <div className="flex flex-col gap-1">
            {topTokens.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-500 text-xs w-5 text-right">#{i + 1}</span>
                <span
                  className="font-mono text-xs w-24 truncate"
                  style={{ color: i === 0 ? '#10b981' : '#cbd5e1' }}
                >
                  {t.token}
                </span>
                <div
                  style={{
                    height: 10,
                    width: Math.round((t.prob / (topTokens[0]?.prob || 1)) * 120),
                    background: i === 0 ? '#10b981' : '#1e293b',
                    borderRadius: 3,
                  }}
                />
                <span className="text-slate-500 text-xs ml-auto">
                  {(t.prob * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <div className="text-slate-500 text-xs">
            Logit range: [{Math.min(...pipelineResult.logits).toFixed(2)},{' '}
            {Math.max(...pipelineResult.logits).toFixed(2)}]
          </div>
        </div>
      );
    }

    return <div className="text-slate-500 text-xs">Select a node to inspect its data.</div>;
  };

  return (
    <div
      style={{
        width: 340,
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#475569',
            textTransform: 'uppercase',
          }}
        >
          Inspector
        </span>
        <button
          onClick={() => setSelectedNodeId(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
