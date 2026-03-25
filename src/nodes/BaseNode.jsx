import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useTransformerStore from '../store/useTransformerStore.js';
import { EXPLANATIONS } from '../data/blockExplanations.js';

/**
 * Shared wrapper for all transformer nodes.
 *
 * Props:
 *   id, nodeType (key into EXPLANATIONS), accentColor (fallback),
 *   hasInput, hasOutput, badge,
 *   formula (advanced math string),
 *   children
 */
export default function BaseNode({
  id,
  nodeType,          // key into EXPLANATIONS — drives title, tagline, learn section
  accentColor,       // fallback if no EXPLANATIONS entry
  hasInput = true,
  hasOutput = true,
  badge,
  formula,
  children,
}) {
  const { selectedNodeId, setSelectedNodeId, hasRun, tourHighlightId } = useTransformerStore();
  const isSelected = selectedNodeId === id;
  const isTourHighlight = tourHighlightId && id.startsWith(tourHighlightId);

  const [learnOpen, setLearnOpen]     = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);

  const exp  = EXPLANATIONS[nodeType] ?? {};
  const color = exp.color ?? accentColor ?? '#6366f1';
  const icon  = exp.icon  ?? '📦';
  const title = exp.displayTitle ?? nodeType;
  const tagline = exp.tagline ?? null;

  return (
    <div
      onClick={() => hasRun && setSelectedNodeId(isSelected ? null : id)}
      style={{
        border: `2px solid ${
          isTourHighlight ? '#facc15' :
          isSelected      ? color     :
          '#334155'
        }`,
        borderRadius: 12,
        background: '#0f172a',
        minWidth: 230,
        maxWidth: 320,
        boxShadow: isTourHighlight
          ? `0 0 0 4px #facc1555, 0 0 24px #facc1540`
          : isSelected
            ? `0 0 0 3px ${color}44, 0 8px 32px #00000060`
            : '0 4px 16px #00000060',
        cursor: hasRun ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.2s',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: color + '20',
          borderBottom: `1px solid ${color}44`,
          borderRadius: '10px 10px 0 0',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 11,
              color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {tagline && (
            <div
              style={{
                fontSize: 10,
                color: '#94a3b8',
                marginTop: 2,
                lineHeight: 1.3,
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {tagline}
            </div>
          )}
        </div>
        {badge && (
          <span
            style={{
              background: color + '30',
              color,
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 4,
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: '0.04em',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px' }}>{children}</div>

      {/* ── Learn / Formula expandables ────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${color}1a`, padding: '0 12px' }}>

        {/* "Explain It" section */}
        {exp.analogy && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setLearnOpen(v => !v); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 0',
                color: learnOpen ? '#fbbf24' : '#94a3b8',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                width: '100%',
              }}
            >
              <span style={{ fontSize: 12 }}>{learnOpen ? '▾' : '▸'}</span>
              📖 Explain It
            </button>

            {learnOpen && (
              <div
                style={{
                  background: '#1e293b',
                  borderRadius: 8,
                  padding: '12px',
                  marginBottom: 8,
                  fontSize: 11,
                  lineHeight: 1.65,
                  color: '#cbd5e1',
                }}
              >
                {/* Analogy */}
                <div style={{ whiteSpace: 'pre-line', marginBottom: 10 }}>
                  {exp.analogy}
                </div>

                {/* In / Out */}
                <div
                  style={{
                    background: '#0f172a',
                    borderRadius: 6,
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    marginBottom: 10,
                    fontSize: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#475569', width: 36, flexShrink: 0 }}>IN</span>
                    <span>
                      <span style={{ color: '#94a3b8' }}>{exp.inputLabel}</span>
                      {exp.inputEx && (
                        <span style={{ color: '#475569', marginLeft: 5, fontFamily: 'monospace' }}>
                          {exp.inputEx}
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#475569', width: 36, flexShrink: 0 }}>OUT</span>
                    <span>
                      <span style={{ color: '#94a3b8' }}>{exp.outputLabel}</span>
                      {exp.outputEx && (
                        <span style={{ color: '#475569', marginLeft: 5, fontFamily: 'monospace' }}>
                          {exp.outputEx}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Key fact */}
                {exp.keyFact && (
                  <div
                    style={{
                      background: color + '15',
                      border: `1px solid ${color}30`,
                      borderRadius: 6,
                      padding: '7px 9px',
                      fontSize: 10,
                      color: '#94a3b8',
                      lineHeight: 1.5,
                    }}
                  >
                    {exp.keyFact}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Formula section */}
        {formula && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setFormulaOpen(v => !v); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 0 6px',
                color: formulaOpen ? color : '#475569',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                width: '100%',
              }}
            >
              <span style={{ fontSize: 12 }}>{formulaOpen ? '▾' : '▸'}</span>
              ∑ Math Formula
            </button>

            {formulaOpen && (
              <div
                style={{
                  background: color + '0d',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 8,
                  fontSize: 11,
                  color: '#94a3b8',
                  fontFamily: 'ui-monospace, monospace',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {formula}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Handles ────────────────────────────────────────────────────── */}
      {hasInput && (
        <Handle
          type="target" position={Position.Left}
          style={{ background: color, border: 'none', width: 10, height: 10 }}
        />
      )}
      {hasOutput && (
        <Handle
          type="source" position={Position.Right}
          style={{ background: color, border: 'none', width: 10, height: 10 }}
        />
      )}
    </div>
  );
}
