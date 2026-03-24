import React from 'react';

/**
 * Renders a single row-vector as a series of coloured bars.
 */
export default function VectorBar({ values, height = 32, maxBars = 32, label }) {
  const display = values.slice(0, maxBars);
  const min = Math.min(...display);
  const max = Math.max(...display);
  const range = max - min || 1;

  return (
    <div className="flex flex-col gap-0.5">
      {label && <div className="text-xs text-slate-400">{label}</div>}
      <div className="flex items-end gap-px" style={{ height }}>
        {display.map((v, i) => {
          const norm = (v - min) / range;
          const h = Math.max(2, Math.round(norm * height));
          const green = Math.round(100 + norm * 155);
          return (
            <div
              key={i}
              title={v.toFixed(4)}
              style={{
                width: 6,
                height: h,
                backgroundColor: `rgb(50,${green},120)`,
                borderRadius: 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
