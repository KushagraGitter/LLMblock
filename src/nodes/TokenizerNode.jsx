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
      title="Tokenizer"
      icon="🔤"
      accentColor="#3b82f6"
      hasInput={false}
      badge={hasRun ? `${tokens.length} tokens` : null}
      formula={`id = vocab[token]\n<BOS> text <EOS>  →  [id₀, id₁, …, idₙ]`}
    >
      {!hasRun ? (
        <div className="text-slate-500 text-xs italic">Run to tokenize input…</div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Input text preview */}
          <div
            className="text-slate-300 text-xs p-2 rounded"
            style={{ background: '#1e293b', maxWidth: 240, wordBreak: 'break-all' }}
          >
            "{inputText.slice(0, 60)}{inputText.length > 60 ? '…' : ''}"
          </div>

          {/* Token chips */}
          <div className="flex flex-wrap gap-1">
            {tokens.slice(0, 16).map((t, i) => (
              <div
                key={i}
                title={`ID: ${t.id}`}
                style={{
                  background: TOKEN_COLORS[i % TOKEN_COLORS.length] + '33',
                  border: `1px solid ${TOKEN_COLORS[i % TOKEN_COLORS.length]}88`,
                  color: TOKEN_COLORS[i % TOKEN_COLORS.length],
                  borderRadius: 4,
                  fontSize: 10,
                  padding: '1px 5px',
                  fontFamily: 'monospace',
                }}
              >
                {t.token}
                <span style={{ opacity: 0.6, marginLeft: 3 }}>#{t.id}</span>
              </div>
            ))}
            {tokens.length > 16 && (
              <div className="text-slate-500 text-xs self-center">
                +{tokens.length - 16} more
              </div>
            )}
          </div>
        </div>
      )}
    </BaseNode>
  );
}
