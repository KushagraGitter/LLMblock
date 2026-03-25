/**
 * ArchComparePanel — side-by-side comparison of GPT, BERT, and T5 attention patterns.
 * Shows how the attention MASK is the key architectural difference.
 */
import React, { useMemo, useState } from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import { getCurrentWeights } from '../store/useTransformerStore.js';
import { getAttentionMaps } from '../lib/transformer.js';
import { tokenize } from '../lib/tokenizer.js';
import { normalizeMatrix } from '../lib/mathUtils.js';

// ── Architecture definitions ──────────────────────────────────────────────────

const ARCHS = [
  {
    id: 'gpt',
    name: 'GPT',
    subtitle: 'Decoder-only · Causal',
    icon: '→',
    color: '#10b981',
    maskMode: 'causal',
    maskLabel: 'Lower-triangle mask',
    maskDesc: 'Token i can only attend to tokens 0 … i. Future tokens are hidden.',
    desc: 'Each token can only see what came BEFORE it. This forces the model to predict the next word without "cheating" by looking ahead.',
    examples: ['GPT-2', 'GPT-4', 'LLaMA', 'Mistral', 'Gemma'],
    usedFor: '✍️  Text generation, chat, autocomplete',
    decoder: false,
  },
  {
    id: 'bert',
    name: 'BERT',
    subtitle: 'Encoder-only · Bidirectional',
    icon: '↔',
    color: '#818cf8',
    maskMode: 'full',
    maskLabel: 'No mask — full bidirectional',
    maskDesc: 'Every token attends to every other token. Full context in both directions.',
    desc: 'Every token sees every other token simultaneously. Better at understanding because context flows in both directions.',
    examples: ['BERT', 'RoBERTa', 'DistilBERT', 'DeBERTa'],
    usedFor: '🔍  Classification, Q&A, search, sentiment',
    decoder: false,
  },
  {
    id: 't5',
    name: 'T5 / Enc-Dec',
    subtitle: 'Encoder + Decoder',
    icon: '⇄',
    color: '#f59e0b',
    maskMode: 'both', // special: encoder=full, decoder=causal
    maskLabel: 'Encoder: full · Decoder: causal',
    maskDesc: 'The encoder reads the full input (like BERT). The decoder generates output token by token (like GPT).',
    desc: 'Two-stage model: encoder reads & understands the input (bidirectional), decoder generates the output (causal). Best of both worlds.',
    examples: ['T5', 'BART', 'mT5', 'Flan-T5'],
    usedFor: '🌐  Translation, summarization, text-to-text',
    decoder: true,
  },
];

// ── Mask pattern visualiser ──────────────────────────────────────────────────

function MaskViz({ maskMode, size, color, label }) {
  const N = Math.min(size, 7);
  return (
    <div>
      <div style={{ fontSize: 9, color: '#475569', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <svg viewBox={`0 0 ${N * 13} ${N * 13}`} style={{ width: N * 13, height: N * 13, display: 'block' }}>
        {Array.from({ length: N }, (_, r) =>
          Array.from({ length: N }, (_, c) => {
            const visible = maskMode === 'causal' ? c <= r : true;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * 13 + 1} y={r * 13 + 1}
                width={11} height={11}
                rx={2}
                fill={visible ? color + 'cc' : '#1e293b'}
                stroke={visible ? color + '44' : '#334155'}
                strokeWidth={0.5}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

// ── Attention heatmap (mini, inline) ─────────────────────────────────────────

function AttentionHeatmap({ weights, labels, color }) {
  if (!weights || weights.length === 0) return null;
  const n = weights.length;
  const cellSize = Math.min(18, Math.floor(240 / n));

  // Normalize 0-1
  const flat = weights.flat();
  const maxV = Math.max(...flat) || 1;
  const norm = weights.map(row => row.map(v => v / maxV));

  function heatColor(t) {
    // Black → color interpolation
    const r = Math.round(t * parseInt(color.slice(1, 3), 16));
    const g = Math.round(t * parseInt(color.slice(3, 5), 16));
    const b = Math.round(t * parseInt(color.slice(5, 7), 16));
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block' }}>
        {/* Col labels */}
        <div style={{ display: 'flex', paddingLeft: cellSize + 4 }}>
          {labels.map((l, c) => (
            <div key={c} style={{
              width: cellSize, fontSize: 7, color: '#475569',
              overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'center',
            }}>
              {l}
            </div>
          ))}
        </div>
        {norm.map((row, r) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: cellSize, fontSize: 7, color: '#475569',
              overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'right',
              paddingRight: 3, flexShrink: 0,
            }}>
              {labels[r]}
            </div>
            {row.map((v, c) => (
              <div
                key={c}
                title={`${labels[r]} → ${labels[c]}: ${weights[r][c].toFixed(3)}`}
                style={{
                  width: cellSize, height: cellSize,
                  background: heatColor(v),
                  border: '1px solid #0f172a',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Single architecture card ──────────────────────────────────────────────────

function ArchCard({ arch, headMaps, decoderMaps, labels, isActive, onSelect }) {
  const firstHeadMap = headMaps?.[0] ?? [];
  const firstDecoderMap = decoderMaps?.[0] ?? [];

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${isActive ? arch.color : '#1e293b'}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        background: isActive ? arch.color + '08' : 'transparent',
      }}
    >
      {/* Header */}
      <div style={{
        background: isActive ? arch.color + '22' : '#0f172a',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 18, width: 32, height: 32, borderRadius: 8,
            background: arch.color + '22', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>{arch.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: arch.color }}>{arch.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{arch.subtitle}</div>
          </div>
        </div>
        <div style={{
          fontSize: 9, color: '#475569', background: '#1e293b',
          borderRadius: 4, padding: '2px 6px',
        }}>
          {isActive ? '▼ details' : '▶ expand'}
        </div>
      </div>

      {/* Always-visible: mask viz + description */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <MaskViz
          maskMode={arch.maskMode === 'both' ? 'full' : arch.maskMode}
          size={Math.min(labels.length, 6)}
          color={arch.color}
          label="Encoder mask"
        />
        {arch.decoder && (
          <MaskViz
            maskMode="causal"
            size={Math.min(labels.length, 6)}
            color="#f87171"
            label="Decoder mask"
          />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            {arch.desc}
          </p>
        </div>
      </div>

      {/* Expanded details */}
      {isActive && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Attention heatmaps */}
          <div>
            <div style={{ fontSize: 9, color: arch.color, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Attention Map — Layer 1, Head 1 ({arch.maskLabel})
            </div>
            <AttentionHeatmap weights={firstHeadMap} labels={labels} color={arch.color} />
            {arch.decoder && firstDecoderMap.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 9, color: '#f87171', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Decoder mask (causal) — same weights, different mask
                </div>
                <AttentionHeatmap weights={firstDecoderMap} labels={labels} color="#f87171" />
              </div>
            )}
          </div>

          {/* Use cases + examples */}
          <div style={{
            background: '#0f172a', borderRadius: 6, padding: '8px 10px',
            fontSize: 10, display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            <div style={{ color: arch.color, fontWeight: 700 }}>{arch.usedFor}</div>
            <div style={{ color: '#475569' }}>
              Known models: {arch.examples.join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function ArchComparePanel() {
  const { inputText, modelConfig, pipelineResult } = useTransformerStore();
  const [activeArch, setActiveArch] = useState('gpt');

  const sentence = inputText?.trim() || 'the cat sat on the mat';

  const tokens = useMemo(() => {
    return tokenize(sentence).slice(0, Math.min(modelConfig.max_seq, 8));
  }, [sentence, modelConfig]);

  const labels = tokens.map(t => t.token);
  const ids = tokens.map(t => t.id);

  // Compute attention maps for each mask mode (reruns when pipeline runs or arch changes)
  const maps = useMemo(() => {
    const w = getCurrentWeights();
    if (!w || ids.length === 0) return { full: [], causal: [] };
    return {
      full:   getAttentionMaps(ids, w.embeddingMatrix, w.layerWeights, modelConfig.n_heads, 'full'),
      causal: getAttentionMaps(ids, w.embeddingMatrix, w.layerWeights, modelConfig.n_heads, 'causal'),
    };
  }, [ids.join(','), pipelineResult, modelConfig]); // eslint-disable-line

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          🏛 Architecture Zoo
        </div>
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          GPT, BERT, and T5 all use the same transformer block — the difference is <strong style={{ color: '#94a3b8' }}>how they mask attention</strong>. Click each to see its attention map on your current input.
        </p>
      </div>

      {/* Current input tokens */}
      <div style={{
        background: '#0f172a', borderRadius: 8, padding: '8px 10px',
      }}>
        <div style={{ fontSize: 9, color: '#334155', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Input tokens ({labels.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {labels.map((l, i) => (
            <span key={i} style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 4, padding: '2px 6px',
              fontSize: 11, color: '#94a3b8', fontFamily: 'monospace',
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Architecture cards */}
      {ARCHS.map(arch => (
        <ArchCard
          key={arch.id}
          arch={arch}
          headMaps={arch.maskMode === 'causal' ? maps.causal : maps.full}
          decoderMaps={arch.decoder ? maps.causal : null}
          labels={labels}
          isActive={activeArch === arch.id}
          onSelect={() => setActiveArch(arch.id === activeArch ? null : arch.id)}
        />
      ))}

      {/* Key insight callout */}
      <div style={{
        background: '#1e1b4b', border: '1px solid #4338ca44',
        borderRadius: 8, padding: '10px 12px', fontSize: 10, color: '#a5b4fc', lineHeight: 1.7,
      }}>
        <strong>Key insight:</strong> The transformer block math is identical across GPT, BERT, and T5.
        What changes is just the <strong>attention mask</strong> — the pattern of which cells are set to −∞ before softmax.
        That single choice determines whether the model can generate text, understand it, or both.
      </div>
    </div>
  );
}
