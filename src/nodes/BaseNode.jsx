import React from 'react';
import { Handle, Position } from '@xyflow/react';
import useTransformerStore from '../store/useTransformerStore.js';

/**
 * Shared wrapper for all transformer LEGO nodes.
 * Props:
 *   id, title, icon, accentColor,
 *   hasInput (bool), hasOutput (bool),
 *   children, badge (short status text)
 */
export default function BaseNode({
  id,
  title,
  icon,
  accentColor = '#6366f1',
  hasInput = true,
  hasOutput = true,
  badge,
  children,
}) {
  const { selectedNodeId, setSelectedNodeId, hasRun } = useTransformerStore();
  const isSelected = selectedNodeId === id;

  return (
    <div
      onClick={() => hasRun && setSelectedNodeId(isSelected ? null : id)}
      style={{
        border: `2px solid ${isSelected ? accentColor : '#334155'}`,
        borderRadius: 12,
        background: '#0f172a',
        minWidth: 220,
        boxShadow: isSelected
          ? `0 0 0 3px ${accentColor}44, 0 8px 32px #00000060`
          : '0 4px 16px #00000060',
        cursor: hasRun ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: accentColor + '22',
          borderBottom: `1px solid ${accentColor}44`,
          borderRadius: '10px 10px 0 0',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: accentColor,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          {title}
        </span>
        {badge && (
          <span
            style={{
              background: accentColor + '33',
              color: accentColor,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>{children}</div>

      {/* Handles */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: accentColor, border: 'none', width: 10, height: 10 }}
        />
      )}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: accentColor, border: 'none', width: 10, height: 10 }}
        />
      )}
    </div>
  );
}
