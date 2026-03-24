import React from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import HeatmapGrid from './HeatmapGrid.jsx';
import LogitLens from './LogitLens.jsx';
import EmbeddingSpace from './EmbeddingSpace.jsx';
import { MODEL_CONFIG } from '../lib/weights.js';
import { normalizeMatrix } from '../lib/mathUtils.js';

const TABS = [
  { id: 'inspector',  icon: '🔎', label: 'Inspector' },
  { id: 'logitLens',  icon: '🔍', label: 'Logit Lens' },
  { id: 'embedSpace', icon: '🌐', label: 'Embed Space' },
];

function InspectorContent() {
  const {
    selectedNodeId, pipelineResult, tokens, topTokens,
    modelConfig, selectedLayerIdx, setSelectedLayerIdx,
  } = useTransformerStore();

  const rowLabels   = tokens.map(t => t.token);
  const blockResult = pipelineResult?.blockResults?.[selectedLayerIdx];

  if (!selectedNodeId) {
    return (
      <div style={{ padding: 20, color: '#475569', fontSize: 12, textAlign: 'center' }}>
        Click any node on the canvas to inspect its data.
      </div>
    );
  }

  if (selectedNodeId?.startsWith('tokenizer')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13, margin: 0 }}>Tokenizer Details</h3>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          Text is split on whitespace/punctuation. Each word is looked up in the vocabulary
          and mapped to an integer ID. Unknown words become <code style={{ color: '#fbbf24' }}>&lt;UNK&gt;</code>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tokens.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
              <span style={{ color: '#475569', width: 16, textAlign: 'right', flexShrink: 0 }}>{i}</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'monospace', width: 80, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t.original || t.token}</span>
              <span style={{ color: '#3b82f6', fontFamily: 'monospace', flex: 1 }}>→ "{t.token}"</span>
              <span style={{ color: '#475569', marginLeft: 'auto', flexShrink: 0 }}>ID: {t.id}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedNodeId?.startsWith('embedding')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ color: '#818cf8', fontWeight: 700, fontSize: 13, margin: 0 }}>Embedding Matrix</h3>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          Each token ID indexes the embedding table W_embed to produce a {modelConfig.d_model}-dim vector.
          Similar words learn similar vectors during training.
        </p>
        <HeatmapGrid
          matrix={pipelineResult.embedNorm}
          rowLabels={rowLabels}
          cellSize={14}
          maxCols={modelConfig.d_model}
        />
        <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>
          Rows = tokens · Cols = embedding dims (d_model={modelConfig.d_model})
        </p>
      </div>
    );
  }

  if (selectedNodeId?.startsWith('positional')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ color: '#c084fc', fontWeight: 700, fontSize: 13, margin: 0 }}>Positional Encoding</h3>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          PE(pos, 2i) = sin(pos / 10000^(2i/d_model))<br />
          PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))<br />
          Each position gets a unique fingerprint. Added to the embeddings.
        </p>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Positional Encoding</div>
          <HeatmapGrid matrix={pipelineResult.peNorm} rowLabels={rowLabels} cellSize={14} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Embedding + PE (model input)</div>
          <HeatmapGrid matrix={pipelineResult.embedWithPENorm} rowLabels={rowLabels} cellSize={14} />
        </div>
      </div>
    );
  }

  if (selectedNodeId?.startsWith('mha') || selectedNodeId?.startsWith('transformerBlock')) {
    const hw = blockResult?.headWeights;
    if (!hw) return <div style={{ color: '#475569', fontSize: 12 }}>No attention data.</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, margin: 0 }}>Attention Maps</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Layer:</span>
          {pipelineResult.blockResults.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedLayerIdx(i)}
              style={{
                padding: '2px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: selectedLayerIdx === i ? '#8b5cf6' : '#1e293b',
                color: selectedLayerIdx === i ? '#fff' : '#94a3b8',
              }}
            >{i + 1}</button>
          ))}
        </div>

        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          Each head computes attention independently. Bright = high weight.
          Rows = query tokens, Cols = key tokens.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {hw.map((weights, h) => (
            <div key={h}>
              <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 4 }}>Head {h + 1}</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13, margin: 0 }}>Feed-Forward Network</h3>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          h = GELU(x·W₁ + b₁) → output = h·W₂ + b₂<br />
          d_model={modelConfig.d_model} → d_ff={modelConfig.d_ff} → d_model={modelConfig.d_model}
        </p>
        {ffnOut && (
          <HeatmapGrid
            matrix={normalizeMatrix(ffnOut)}
            rowLabels={rowLabels}
            cellSize={14}
            maxCols={modelConfig.d_model}
          />
        )}
      </div>
    );
  }

  if (selectedNodeId?.startsWith('output')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ color: '#34d399', fontWeight: 700, fontSize: 13, margin: 0 }}>Output Probabilities</h3>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          The final hidden state of the last token is projected through a linear layer
          to vocab_size logits. Softmax converts to probabilities.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {topTokens.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#475569', fontSize: 10, width: 20, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, width: 72, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexShrink: 0, color: i === 0 ? '#10b981' : '#cbd5e1' }}>
                {t.token}
              </span>
              <div style={{
                height: 10, borderRadius: 3,
                width: Math.round((t.prob / (topTokens[0]?.prob || 1)) * 120),
                background: i === 0 ? '#10b981' : '#1e293b',
                border: i === 0 ? 'none' : '1px solid #334155',
              }} />
              <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto', flexShrink: 0 }}>
                {(t.prob * 100).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#334155' }}>
          Logit range: [{Math.min(...pipelineResult.logits).toFixed(2)},{' '}
          {Math.max(...pipelineResult.logits).toFixed(2)}]
        </div>
      </div>
    );
  }

  return null;
}

export default function DetailPanel() {
  const {
    selectedNodeId, setSelectedNodeId,
    hasRun, rightPanelTab, setRightPanelTab,
  } = useTransformerStore();

  const isOpen = hasRun;
  if (!isOpen) return null;

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
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          background: '#020617',
          flexShrink: 0,
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setRightPanelTab(tab.id)}
            style={{
              flex: 1,
              padding: '9px 4px',
              border: 'none',
              borderBottom: rightPanelTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: rightPanelTab === tab.id ? 700 : 400,
              color: rightPanelTab === tab.id ? '#818cf8' : '#475569',
              transition: 'color 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span>{tab.icon}</span>
            <span style={{ letterSpacing: '0.04em' }}>{tab.label}</span>
          </button>
        ))}
        {selectedNodeId && (
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{
              padding: '0 10px',
              border: 'none', background: 'none',
              color: '#475569', cursor: 'pointer', fontSize: 16,
            }}
          >×</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: rightPanelTab === 'embedSpace' ? 0 : '14px 14px' }}>
        {rightPanelTab === 'inspector'  && <InspectorContent />}
        {rightPanelTab === 'logitLens'  && <LogitLens />}
        {rightPanelTab === 'embedSpace' && <EmbeddingSpace />}
      </div>
    </div>
  );
}
