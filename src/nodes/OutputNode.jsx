import React from 'react';
import BaseNode from './BaseNode.jsx';
import useTransformerStore from '../store/useTransformerStore.js';

export default function OutputNode({ id }) {
  const { topTokens, hasRun } = useTransformerStore();

  const maxProb = topTokens[0]?.prob ?? 1;

  return (
    <BaseNode
      id={id}
      title="Linear + Softmax"
      icon="🎯"
      accentColor="#10b981"
      hasOutput={false}
      badge={hasRun ? 'next-token probs' : null}
      formula={`logits = h_last · W_out + b\nP(y) = softmax(logits)\nshape: (vocab_size,)`}
    >
      {!hasRun ? (
        <div className="text-slate-500 text-xs italic">
          Projects hidden state → vocabulary probabilities
        </div>
      ) : (
        <div className="flex flex-col gap-1" style={{ minWidth: 220 }}>
          <div className="text-slate-400 text-xs mb-1">Top-12 next-token predictions</div>
          {topTokens.map((t, i) => {
            const barWidth = Math.round((t.prob / maxProb) * 160);
            return (
              <div key={i} className="flex items-center gap-2">
                {/* Rank */}
                <span
                  style={{
                    width: 16,
                    fontSize: 9,
                    color: '#64748b',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  #{i + 1}
                </span>

                {/* Token label */}
                <span
                  style={{
                    width: 64,
                    fontSize: 11,
                    color: i === 0 ? '#10b981' : '#94a3b8',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                  }}
                >
                  {t.token}
                </span>

                {/* Bar */}
                <div
                  style={{
                    height: 10,
                    width: barWidth,
                    background:
                      i === 0
                        ? '#10b981'
                        : i < 3
                        ? '#34d399'
                        : '#1e293b',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />

                {/* Prob */}
                <span style={{ fontSize: 9, color: '#64748b' }}>
                  {(t.prob * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </BaseNode>
  );
}
