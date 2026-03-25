import React from 'react';
import BaseNode from './BaseNode.jsx';
import useTransformerStore from '../store/useTransformerStore.js';

export default function OutputNode({ id }) {
  const { topTokens, hasRun } = useTransformerStore();

  const maxProb = topTokens[0]?.prob ?? 1;

  return (
    <BaseNode
      id={id}
      nodeType="output"
      hasOutput={false}
      badge={hasRun ? 'next-token probs' : null}
      formula={`logits = h_last · W_out + b\nP(y) = softmax(logits)\nshape: (vocab_size,)`}
    >
      {!hasRun ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 9, color: '#475569' }}>Example next-word prediction:</div>
          {[
            { token: 'model', prob: 0.34, color: '#10b981' },
            { token: 'network', prob: 0.21, color: '#34d399' },
            { token: 'system', prob: 0.12, color: '#1e293b' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 52, fontSize: 10, color: t.color, fontFamily: 'monospace', flexShrink: 0 }}>{t.token}</span>
              <div style={{ height: 10, width: Math.round(t.prob * 140), borderRadius: 2, background: t.color }} />
              <span style={{ fontSize: 9, color: '#475569' }}>{(t.prob * 100).toFixed(0)}%</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: '#334155' }}>Run to see real predictions for your input</div>
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
