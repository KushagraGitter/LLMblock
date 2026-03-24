import React, { useMemo, useState } from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import { pca2D } from '../lib/mathUtils.js';
import { vocab, VOCAB_SIZE } from '../lib/tokenizer.js';
import { defaultWeights } from '../lib/weights.js';

const SAMPLE_SIZE = 120; // show a subset of vocab for perf

/**
 * 2D PCA projection of token embeddings.
 * Input tokens are highlighted in a distinct colour.
 */
export default function EmbeddingSpace() {
  const { pipelineResult, tokens, hasRun } = useTransformerStore();
  const [hovered, setHovered] = useState(null);

  // Use current pipeline's embedding matrix if available, else default
  const embMatrix = pipelineResult
    ? defaultWeights.embeddingMatrix  // weights are static for now
    : defaultWeights.embeddingMatrix;

  // Sample vocab indices — always include input tokens
  const inputIds = new Set((tokens ?? []).map(t => t.id));

  const sampleIds = useMemo(() => {
    const ids = [...inputIds];
    const step = Math.max(1, Math.floor(VOCAB_SIZE / (SAMPLE_SIZE - ids.length)));
    for (let i = 0; i < VOCAB_SIZE && ids.length < SAMPLE_SIZE; i += step) {
      if (!inputIds.has(i)) ids.push(i);
    }
    return ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const projected = useMemo(() => {
    const rows = sampleIds.map(id => embMatrix[id]);
    return pca2D(rows);
  }, [sampleIds, embMatrix]);

  // Normalise to SVG coordinate space [10, 290]
  const pts = useMemo(() => {
    if (!projected.length) return [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of projected) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    return projected.map(([x, y], i) => ({
      x: 14 + ((x - minX) / rangeX) * 272,
      y: 14 + ((y - minY) / rangeY) * 272,
      id: sampleIds[i],
      token: vocab[sampleIds[i]] ?? `[${sampleIds[i]}]`,
      isInput: inputIds.has(sampleIds[i]),
    }));
  }, [projected, sampleIds, inputIds]);

  return (
    <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', marginBottom: 4 }}>
          🌐 Embedding Space
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
          {SAMPLE_SIZE} tokens projected to 2D via PCA. Highlighted = tokens in your input.
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8' }}>
        <span>
          <span style={{ color: '#f59e0b', marginRight: 4 }}>●</span>Input tokens
        </span>
        <span>
          <span style={{ color: '#334155', marginRight: 4 }}>●</span>Other vocab
        </span>
      </div>

      {/* SVG scatter plot */}
      <svg
        width="300"
        height="300"
        style={{
          background: '#020617',
          borderRadius: 8,
          border: '1px solid #1e293b',
          overflow: 'visible',
        }}
      >
        {/* Grid lines */}
        {[75, 150, 225].map(v => (
          <React.Fragment key={v}>
            <line x1={v} y1={0} x2={v} y2={300} stroke="#1e293b" strokeWidth={0.5} />
            <line x1={0} y1={v} x2={300} y2={v} stroke="#1e293b" strokeWidth={0.5} />
          </React.Fragment>
        ))}

        {/* Points */}
        {pts.map((p) => (
          <g key={p.id} onMouseEnter={() => setHovered(p)} onMouseLeave={() => setHovered(null)}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.isInput ? 5 : 3}
              fill={p.isInput ? '#f59e0b' : '#1e3a5f'}
              stroke={p.isInput ? '#fbbf24' : '#1e293b'}
              strokeWidth={p.isInput ? 1.5 : 0.5}
              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
            />
            {/* Always show label for input tokens */}
            {p.isInput && (
              <text
                x={p.x + 6}
                y={p.y + 3}
                fontSize={9}
                fill="#fbbf24"
                fontFamily="monospace"
              >
                {p.token}
              </text>
            )}
          </g>
        ))}

        {/* Hover tooltip */}
        {hovered && !hovered.isInput && (
          <g>
            <rect
              x={Math.min(hovered.x + 6, 220)}
              y={hovered.y - 14}
              width={hovered.token.length * 6.5 + 10}
              height={18}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth={0.8}
              rx={3}
            />
            <text
              x={Math.min(hovered.x + 11, 225)}
              y={hovered.y - 2}
              fontSize={10}
              fill="#cbd5e1"
              fontFamily="monospace"
            >
              {hovered.token}
            </text>
          </g>
        )}
      </svg>

      <div style={{ fontSize: 10, color: '#334155' }}>
        PC1 (x-axis) and PC2 (y-axis) explain the most variance in embedding space.
      </div>
    </div>
  );
}
