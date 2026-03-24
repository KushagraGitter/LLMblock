import React, { useMemo } from 'react';
import { normalizeMatrix } from '../lib/mathUtils.js';

/**
 * Renders a 2-D matrix as a colour heatmap using a CSS grid.
 * Uses the viridis-inspired colour scale.
 */

function valueToColor(v, scheme = 'viridis') {
  const t = Math.max(0, Math.min(1, v));
  if (scheme === 'viridis') {
    // Simplified viridis: dark-purple → teal → yellow
    const r = Math.round(68 + t * (253 - 68));
    const g = Math.round(1  + t * (231 - 1));
    const b = Math.round(84 + (t < 0.5 ? t * 2 * (140 - 84) : (1 - (t - 0.5) * 2) * (140 - 84) + (t - 0.5) * 2 * 37));
    return `rgb(${r},${g},${b})`;
  }
  if (scheme === 'redblue') {
    // Red → White → Blue
    if (t < 0.5) {
      const f = t * 2;
      return `rgb(${Math.round(220 * f + 255 * (1 - f))},${Math.round(50 * f + 255 * (1 - f))},${Math.round(32 * f + 255 * (1 - f))})`;
    } else {
      const f = (t - 0.5) * 2;
      return `rgb(${Math.round(255 * (1 - f) + 32 * f)},${Math.round(255 * (1 - f) + 100 * f)},${Math.round(255 * (1 - f) + 220 * f)})`;
    }
  }
  // Default: grayscale
  const c = Math.round(t * 255);
  return `rgb(${c},${c},${c})`;
}

export default function HeatmapGrid({
  matrix,
  rowLabels,
  colLabels,
  scheme = 'viridis',
  cellSize = 14,
  maxRows = 20,
  maxCols = 32,
  showValues = false,
  className = '',
}) {
  const normalized = useMemo(() => normalizeMatrix(matrix), [matrix]);

  const rows = Math.min(normalized.length, maxRows);
  const cols = Math.min(normalized[0]?.length ?? 0, maxCols);

  return (
    <div className={`overflow-auto ${className}`}>
      <div style={{ display: 'inline-block' }}>
        {/* Column labels */}
        {colLabels && (
          <div style={{ display: 'flex', marginLeft: rowLabels ? 60 : 0 }}>
            {colLabels.slice(0, cols).map((label, j) => (
              <div
                key={j}
                style={{
                  width: cellSize,
                  fontSize: 8,
                  textAlign: 'center',
                  color: '#94a3b8',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Row label */}
            {rowLabels && (
              <div
                style={{
                  width: 56,
                  fontSize: 9,
                  color: '#94a3b8',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  paddingRight: 4,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {rowLabels[i]}
              </div>
            )}
            {Array.from({ length: cols }).map((_, j) => {
              const val = normalized[i][j];
              return (
                <div
                  key={j}
                  title={matrix[i][j]?.toFixed(4)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: valueToColor(val, scheme),
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
