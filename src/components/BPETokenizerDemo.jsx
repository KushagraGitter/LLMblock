import React, { useState, useMemo } from 'react';
import { encode, decode } from 'gpt-tokenizer';

// Colour palette — cycles through for visual token boundaries
const COLOURS = [
  ['#3b82f620', '#3b82f6'],
  ['#8b5cf620', '#8b5cf6'],
  ['#10b98120', '#10b981'],
  ['#f59e0b20', '#f59e0b'],
  ['#ef444420', '#ef4444'],
  ['#06b6d420', '#06b6d4'],
  ['#ec489920', '#ec4899'],
  ['#84cc1620', '#84cc16'],
];

function colourFor(i) { return COLOURS[i % COLOURS.length]; }

/**
 * Converts raw BPE token IDs back into their display strings.
 * Uses TextDecoder to handle byte-level tokens correctly.
 */
function tokenToString(id) {
  try { return decode([id]); } catch { return `[${id}]`; }
}

export default function BPETokenizerDemo() {
  const [text, setText] = useState('unbelievable transformer attention');

  const tokens = useMemo(() => {
    try {
      const ids = encode(text);
      return ids.map((id, i) => ({ id, text: tokenToString(id), idx: i }));
    } catch {
      return [];
    }
  }, [text]);

  // Highlight the original text with coloured token spans
  const highlighted = useMemo(() => {
    const parts = [];
    let cursor = 0;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const tok = t.text;
      // Find where this token appears in the remaining text
      const pos = text.indexOf(tok, cursor);
      if (pos === -1) {
        parts.push({ text: tok, idx: i });
        continue;
      }
      if (pos > cursor) parts.push({ text: text.slice(cursor, pos), idx: -1 });
      parts.push({ text: tok, idx: i });
      cursor = pos + tok.length;
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), idx: -1 });
    return parts;
  }, [text, tokens]);

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#22d3ee', marginBottom: 4 }}>
          ✂️ Real GPT-2 BPE Tokenizer
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.55 }}>
          This is the <b style={{ color: '#94a3b8' }}>actual</b> tokenizer used by GPT-2, GPT-3, and
          ChatGPT. It splits words into subword pieces — so it can handle <em>any</em> text,
          even words it has never seen.
        </div>
      </div>

      {/* Input */}
      <div>
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Type anything
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, padding: '8px 10px',
            color: '#f1f5f9', fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            resize: 'vertical', outline: 'none',
          }}
          placeholder="Type anything — even emoji, code, or other languages…"
        />
      </div>

      {/* Stat bar */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          ['Characters', text.length],
          ['Tokens', tokens.length],
          ['Chars/token', tokens.length ? (text.length / tokens.length).toFixed(1) : '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ flex: 1, background: '#1e293b', borderRadius: 7, padding: '7px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#22d3ee' }}>{val}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Coloured text */}
      <div>
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 6, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Token boundaries in your text
        </div>
        <div style={{
          background: '#1e293b', borderRadius: 8, padding: '10px 12px',
          fontSize: 14, lineHeight: 1.8, fontFamily: 'ui-monospace, monospace',
          wordBreak: 'break-all',
        }}>
          {highlighted.map((part, i) => {
            if (part.idx === -1) return <span key={i} style={{ color: '#475569' }}>{part.text}</span>;
            const [bg, border] = colourFor(part.idx);
            return (
              <span
                key={i}
                title={`Token ID: ${tokens[part.idx]?.id}`}
                style={{
                  background: bg, borderBottom: `2px solid ${border}`,
                  borderRadius: 3, padding: '1px 1px',
                  cursor: 'default',
                }}
              >
                {part.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Token chips */}
      <div>
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 6, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Individual tokens
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {tokens.map((t, i) => {
            const [bg, border] = colourFor(i);
            return (
              <div key={i} style={{
                background: bg, border: `1px solid ${border}`,
                borderRadius: 5, padding: '3px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}>
                <span style={{ fontSize: 11, color: '#f1f5f9', fontFamily: 'monospace' }}>
                  {JSON.stringify(t.text)}
                </span>
                <span style={{ fontSize: 8, color: border, opacity: 0.8 }}>#{t.id}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* VS demo tokenizer callout */}
      <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#64748b', lineHeight: 1.55 }}>
        <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>⚡ Why is this different from the demo model?</div>
        The canvas demo uses a <b style={{ color: '#f59e0b' }}>simplified word-level tokenizer</b> with
        only ~256 known words — unknown words become &lt;UNK&gt;. Real GPT-2 uses{' '}
        <b style={{ color: '#22d3ee' }}>50,257 BPE tokens</b> and can handle any word by
        splitting it into pieces: <code style={{ color: '#a78bfa' }}>unbelievable → ["un","believ","able"]</code>.
      </div>

      {/* Try it hints */}
      <div>
        <div style={{ fontSize: 10, color: '#334155', marginBottom: 6 }}>TRY THESE:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[
            'Hello, world!',
            'ChatGPT is amazing',
            'αβγδ epsilon',
            'def fibonacci(n):',
            '🤖 AI tokenization',
            'supercalifragilistic',
          ].map(ex => (
            <button key={ex} onClick={() => setText(ex)}
              style={{
                padding: '4px 9px', borderRadius: 5, fontSize: 10,
                border: '1px solid #334155', background: 'none',
                color: '#64748b', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#22d3ee'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
