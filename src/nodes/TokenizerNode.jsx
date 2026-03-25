import React from 'react';
import BaseNode from './BaseNode.jsx';
import useTransformerStore from '../store/useTransformerStore.js';

const TOKEN_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

export default function TokenizerNode({ id }) {
  const { tokens, hasRun, inputText } = useTransformerStore();

  return (
    <BaseNode
      id={id}
      nodeType="tokenizer"
      hasInput={false}
      badge={hasRun ? `${tokens.length} tokens` : null}
      formula={`id = vocab[token]\n<BOS> text <EOS>  →  [id₀, id₁, …, idₙ]`}
    >
      {!hasRun ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, color: '#475569' }}>Example split:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>"unbelievable"</span>
            <span style={{ fontSize: 10, color: '#334155' }}>→</span>
            {['un', 'believ', 'able'].map((t, i) => (
              <span key={i} style={{
                background: TOKEN_COLORS[i] + '25', border: `1px solid ${TOKEN_COLORS[i]}55`,
                color: TOKEN_COLORS[i], borderRadius: 4, fontSize: 10, padding: '1px 5px', fontFamily: 'monospace',
              }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 9, color: '#334155' }}>
            Hit ▶ Run to tokenize your own text
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: '#1e293b', borderRadius: 6, padding: '5px 8px',
              fontSize: 11, color: '#94a3b8', wordBreak: 'break-all', maxWidth: 260,
            }}
          >
            "{inputText.slice(0, 60)}{inputText.length > 60 ? '…' : ''}"
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tokens.slice(0, 16).map((t, i) => (
              <div
                key={i}
                title={`Token ID: ${t.id}`}
                style={{
                  background: TOKEN_COLORS[i % TOKEN_COLORS.length] + '25',
                  border: `1px solid ${TOKEN_COLORS[i % TOKEN_COLORS.length]}66`,
                  color: TOKEN_COLORS[i % TOKEN_COLORS.length],
                  borderRadius: 4, fontSize: 10,
                  padding: '2px 6px', fontFamily: 'monospace',
                }}
              >
                {t.token}
                <span style={{ opacity: 0.55, marginLeft: 3, fontSize: 9 }}>#{t.id}</span>
              </div>
            ))}
            {tokens.length > 16 && (
              <span style={{ color: '#475569', fontSize: 10, alignSelf: 'center' }}>
                +{tokens.length - 16} more
              </span>
            )}
          </div>

          <div style={{ fontSize: 9, color: '#334155' }}>
            Each chip = one token · Hover to see its ID
          </div>
        </div>
      )}
    </BaseNode>
  );
}
