import React from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import HeatmapGrid from './HeatmapGrid.jsx';
import LogitLens from './LogitLens.jsx';
import EmbeddingSpace from './EmbeddingSpace.jsx';
import ExamplesPanel from './ExamplesPanel.jsx';
import ExperimentsPanel from './ExperimentsPanel.jsx';
import BPETokenizerDemo from './BPETokenizerDemo.jsx';
import PythonExportPanel from './PythonExportPanel.jsx';
import { MODEL_CONFIG } from '../lib/weights.js';
import { normalizeMatrix } from '../lib/mathUtils.js';
import { EXPLANATIONS } from '../data/blockExplanations.js';

/** Beginner-friendly explanation card shown at the top of Inspector */
function ExplainCard({ nodeType }) {
  const exp = EXPLANATIONS[nodeType];
  if (!exp) return null;
  return (
    <div
      style={{
        background: exp.color + '0e',
        border: `1px solid ${exp.color}30`,
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
        <span style={{ fontSize: 22 }}>{exp.icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: exp.color }}>{exp.displayTitle}</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>{exp.tagline}</div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.65, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
        {exp.analogy}
      </p>
      <div style={{ background: '#0f172a', borderRadius: 7, padding: '7px 9px', fontSize: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <span style={{ color: '#475569', width: 32, flexShrink: 0 }}>IN</span>
          <span style={{ color: '#94a3b8' }}>{exp.inputLabel}
            {exp.inputEx && <span style={{ color: '#475569', marginLeft: 5 }}>{exp.inputEx}</span>}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: '#475569', width: 32, flexShrink: 0 }}>OUT</span>
          <span style={{ color: '#94a3b8' }}>{exp.outputLabel}
            {exp.outputEx && <span style={{ color: '#475569', marginLeft: 5 }}>{exp.outputEx}</span>}
          </span>
        </div>
      </div>
      {exp.keyFact && (
        <div style={{ fontSize: 10, color: '#64748b', background: '#1e293b', borderRadius: 6, padding: '6px 9px', lineHeight: 1.5 }}>
          {exp.keyFact}
        </div>
      )}
    </div>
  );
}

/** Resolve nodeType from nodeId prefix */
function nodeTypeFromId(id) {
  if (!id) return null;
  if (id.startsWith('tokenizer'))       return 'tokenizer';
  if (id.startsWith('embedding'))       return 'embedding';
  if (id.startsWith('positional'))      return 'positionalEncoding';
  if (id.startsWith('mha'))             return 'multiHeadAttention';
  if (id.startsWith('ffn'))             return 'ffn';
  if (id.startsWith('transformerBlock')) return 'transformerBlock';
  if (id.startsWith('output'))          return 'output';
  return null;
}

const TABS = [
  { id: 'inspector',   icon: '🔎', label: 'Inspect'  },
  { id: 'logitLens',   icon: '🔍', label: 'Lens'     },
  { id: 'embedSpace',  icon: '🌐', label: 'Embed'    },
  { id: 'examples',    icon: '📚', label: 'Examples' },
  { id: 'experiments', icon: '🔬', label: 'Break'    },
  { id: 'tokenizer',   icon: '✂️', label: 'Tokens'   },
  { id: 'export',      icon: '🐍', label: 'Export'   },
];

function InspectorContent() {
  const {
    selectedNodeId, pipelineResult, tokens, topTokens,
    modelConfig, selectedLayerIdx, setSelectedLayerIdx,
  } = useTransformerStore();

  const rowLabels   = tokens.map(t => t.token);
  const blockResult = pipelineResult?.blockResults?.[selectedLayerIdx];
  const nodeType    = nodeTypeFromId(selectedNodeId);

  if (!selectedNodeId) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textAlign: 'center' }}>
          👆 Click any block on the canvas
        </div>
        <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', lineHeight: 1.6 }}>
          Each block does one specific job. Click it to see a plain-language explanation and the actual data flowing through it.
        </div>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: '#334155', marginBottom: 8 }}>ALL BLOCKS EXPLAINED:</div>
          {Object.entries(EXPLANATIONS).map(([key, exp]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{exp.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: exp.color }}>{exp.displayTitle}</div>
                <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.4 }}>{exp.tagline}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Always show explain card at top when a node is selected
  const ExplainSection = () => <ExplainCard nodeType={nodeType} />;


  if (selectedNodeId?.startsWith('tokenizer')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ExplainSection />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Token Lookup Table</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tokens.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
              <span style={{ color: '#334155', width: 18, textAlign: 'right', flexShrink: 0 }}>{i}</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'monospace', flex: 1 }}>"{t.token}"</span>
              <span style={{ color: '#3b82f6', fontFamily: 'monospace', flexShrink: 0 }}>ID {t.id}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>
          Unknown words become ID 3 (UNK token)
        </div>
      </div>
    );
  }

  if (selectedNodeId?.startsWith('embedding')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ExplainSection />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Embedding Heatmap</div>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          Each <b style={{ color: '#818cf8' }}>row</b> is one token's meaning vector.
          Each <b style={{ color: '#818cf8' }}>column</b> is one dimension of meaning.
          Bright = high value, dark = low value.
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ExplainSection />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Visualisation</div>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          Notice the wave-like pattern — each <b style={{ color: '#c084fc' }}>row</b> (position) has a unique fingerprint made of alternating sine and cosine waves.
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
    const nt  = selectedNodeId?.startsWith('mha') ? 'multiHeadAttention' : 'transformerBlock';
    const hw  = blockResult?.headWeights;
    if (!hw) return (
      <div style={{ padding: 14 }}>
        <ExplainCard nodeType={nt} />
        <div style={{ color: '#475569', fontSize: 12 }}>Run the pipeline to see attention maps.</div>
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ExplainCard nodeType={nt} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Attention Maps</div>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          Each square shows what a <b style={{ color: '#a78bfa' }}>query word</b> (row) is paying attention to (<b style={{ color: '#a78bfa' }}>key words</b>, columns). <b style={{ color: '#fbbf24' }}>Bright = strong attention</b>.
        </p>

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
        <ExplainSection />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>FFN Output</div>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          Each <b style={{ color: '#f59e0b' }}>row</b> = one token's representation after the FFN.
          Dimensionality: {modelConfig.d_model} → {modelConfig.d_ff} → {modelConfig.d_model}
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
        <ExplainSection />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Next-Token Predictions</div>
        <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          The <b style={{ color: '#34d399' }}>longest bar</b> = the model's best guess for the next word.
          Try <b style={{ color: '#a78bfa' }}>🎲 Generate</b> to see it pick words one by one.
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
    rightPanelTab, setRightPanelTab,
  } = useTransformerStore();

  const noPad = rightPanelTab === 'embedSpace' || rightPanelTab === 'examples' ||
                rightPanelTab === 'experiments' || rightPanelTab === 'tokenizer' ||
                rightPanelTab === 'export';

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
          overflowX: 'auto',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setRightPanelTab(tab.id)}
            style={{
              flex: '0 0 auto',
              padding: '8px 8px',
              border: 'none',
              borderBottom: rightPanelTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: rightPanelTab === tab.id ? 700 : 400,
              color: rightPanelTab === tab.id ? '#818cf8' : '#475569',
              transition: 'color 0.15s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minWidth: 44,
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            <span style={{ letterSpacing: '0.04em' }}>{tab.label}</span>
          </button>
        ))}
        {selectedNodeId && (
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{
              marginLeft: 'auto',
              padding: '0 10px',
              border: 'none', background: 'none',
              color: '#475569', cursor: 'pointer', fontSize: 16,
              flexShrink: 0,
            }}
          >×</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: noPad ? 0 : '14px 14px' }}>
        {rightPanelTab === 'inspector'   && <InspectorContent />}
        {rightPanelTab === 'logitLens'   && <LogitLens />}
        {rightPanelTab === 'embedSpace'  && <EmbeddingSpace />}
        {rightPanelTab === 'examples'    && <ExamplesPanel />}
        {rightPanelTab === 'experiments' && <ExperimentsPanel />}
        {rightPanelTab === 'tokenizer'   && <BPETokenizerDemo />}
        {rightPanelTab === 'export'      && <PythonExportPanel />}
      </div>
    </div>
  );
}
