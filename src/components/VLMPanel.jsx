/**
 * VLMPanel — Vision Transformer educational visualiser.
 * Shows how images are split into patches, each patch becomes a token,
 * and the same transformer processes them just like text tokens.
 */
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { getCurrentWeights } from '../store/useTransformerStore.js';
import useTransformerStore from '../store/useTransformerStore.js';
import { runPipelineFromEmbeddings } from '../lib/transformer.js';
import { randomMatrix, matmul } from '../lib/mathUtils.js';

// ── Demo image — 4×4 grid of colourful patches (no upload needed) ─────────────

const GRID = 4; // 4×4 = 16 patches
const CELL = 52; // px per cell in the visual display

const DEMO_PATCH_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#84cc16', '#10b981',
  '#64748b', '#94a3b8', '#475569', '#cbd5e1',
];

/** Parse hex colour → normalised [r,g,b] in [-0.5, 0.5] */
function hexToNorm(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255 - 0.5;
  const g = parseInt(hex.slice(3, 5), 16) / 255 - 0.5;
  const b = parseInt(hex.slice(5, 7), 16) / 255 - 0.5;
  return [r, g, b];
}

/** Extract 4×4 mean-RGB patches from ImageData */
function extractPatches(imageData, imgW, imgH) {
  const patches = [];
  const pw = Math.floor(imgW / GRID);
  const ph = Math.floor(imgH / GRID);
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      let R = 0, G = 0, B = 0, count = 0;
      for (let y = row * ph; y < (row + 1) * ph && y < imgH; y++) {
        for (let x = col * pw; x < (col + 1) * pw && x < imgW; x++) {
          const idx = (y * imgW + x) * 4;
          R += imageData.data[idx];
          G += imageData.data[idx + 1];
          B += imageData.data[idx + 2];
          count++;
        }
      }
      patches.push([
        R / count / 255 - 0.5,
        G / count / 255 - 0.5,
        B / count / 255 - 0.5,
      ]);
    }
  }
  return patches; // 16 × [r,g,b]
}

// ── Seeded random projection matrix W_patch: 3 → d_model ─────────────────────

function getPatchProjection(dModel) {
  return randomMatrix(3, dModel, 9999, 0.8);
}

// ── Run ViT forward pass ──────────────────────────────────────────────────────

function runVIT(patchColors, dModel, nHeads, layerWeights, finalLnGamma, finalLnBeta) {
  const W = getPatchProjection(dModel);

  // Project each patch [r,g,b] → [d_model] via W_patch
  const patchEmbeds = patchColors.map(rgb => matmul([rgb], W)[0]);

  // Prepend [CLS] token (zeros)
  const clsToken = new Array(dModel).fill(0);
  const allEmbeds = [clsToken, ...patchEmbeds]; // 17 × d_model

  // Run transformer layers
  const { blockResults } = runPipelineFromEmbeddings(
    allEmbeds, layerWeights, finalLnGamma, finalLnBeta, nHeads
  );

  // CLS attention to patches from first head, first layer (row 0 = CLS, cols 1..16 = patches)
  const clsAttn = blockResults[0]?.headWeights?.[0]?.[0]?.slice(1) ?? [];
  const allHeads = blockResults[0]?.headWeights ?? [];

  return { clsAttn, allHeads };
}

// ── Attention overlay colour ──────────────────────────────────────────────────

function attnColor(weight, maxW) {
  const t = maxW > 0 ? weight / maxW : 0;
  // Transparent blue → bright gold
  const r = Math.round(251 * t);
  const g = Math.round(191 * t);
  const b = Math.round(36 * (1 - t));
  return `rgba(${r},${g},${b},${0.15 + t * 0.75})`;
}

// ── Step badge ───────────────────────────────────────────────────────────────

function Step({ n, label, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: active ? '#6366f1' : '#1e293b',
        border: `1px solid ${active ? '#818cf8' : '#334155'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: active ? '#fff' : '#475569',
      }}>{n}</div>
      <span style={{ fontSize: 10, color: active ? '#cbd5e1' : '#475569' }}>{label}</span>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function VLMPanel() {
  const { modelConfig } = useTransformerStore();
  const [step, setStep]         = useState(0); // 0=patches, 1=tokens, 2=attention
  const [hoveredPatch, setHover] = useState(null); // 0-15 (patch index)
  const [uploadedColors, setUploaded] = useState(null); // 16 × [r,g,b]
  const [uploadedGrid, setUploadedGrid] = useState(null); // 4×4 hex colors for display
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);

  // Choose patch colors (uploaded or demo)
  const patchHexColors = uploadedGrid ?? DEMO_PATCH_COLORS;
  const patchNormColors = useMemo(
    () => uploadedColors ?? DEMO_PATCH_COLORS.map(hexToNorm),
    [uploadedColors]
  );

  // Run ViT
  const vitResult = useMemo(() => {
    const w = getCurrentWeights();
    if (!w) return null;
    try {
      return runVIT(
        patchNormColors,
        modelConfig.d_model,
        modelConfig.n_heads,
        w.layerWeights,
        w.finalLnGamma,
        w.finalLnBeta,
      );
    } catch { return null; }
  }, [patchNormColors, modelConfig]);

  const clsAttn  = vitResult?.clsAttn ?? [];
  const allHeads = vitResult?.allHeads ?? [];

  // Which attention to display (hovered patch or CLS)
  const displayAttn = useMemo(() => {
    if (!allHeads.length) return [];
    const head0 = allHeads[0]; // [seqLen][seqLen], seqLen = 17 (CLS + 16 patches)
    if (hoveredPatch !== null) {
      // Row (hoveredPatch+1) = that patch's attention to all others (skip CLS for display)
      return head0[hoveredPatch + 1]?.slice(1) ?? [];
    }
    // Default: CLS attention to patches
    return head0[0]?.slice(1) ?? [];
  }, [hoveredPatch, allHeads]);

  const maxAttn = Math.max(...displayAttn, 0.001);

  // ── Image upload handler ─────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      URL.revokeObjectURL(url);

      const normPatches = extractPatches(imageData, size, size);

      // For display: compute average hex colour per patch
      const pw = size / GRID;
      const hexPatches = [];
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          let R = 0, G = 0, B = 0, count = 0;
          for (let y = Math.floor(row * pw); y < Math.floor((row + 1) * pw); y++) {
            for (let x = Math.floor(col * pw); x < Math.floor((col + 1) * pw); x++) {
              const idx = (y * size + x) * 4;
              R += imageData.data[idx];
              G += imageData.data[idx + 1];
              B += imageData.data[idx + 2];
              count++;
            }
          }
          const toHex = v => Math.round(v / count).toString(16).padStart(2, '0');
          hexPatches.push(`#${toHex(R)}${toHex(G)}${toHex(B)}`);
        }
      }
      setUploaded(normPatches);
      setUploadedGrid(hexPatches);
      setStep(0);
    };
    img.src = url;
  }, []);

  const onFileChange = (e) => handleFile(e.target.files?.[0]);
  const onDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); };
  const onDragOver = (e) => e.preventDefault();

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          🖼 Vision Transformer (ViT)
        </div>
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          CLIP, ViT, and LLaVA process images the <strong style={{ color: '#94a3b8' }}>exact same way</strong> as text — by splitting them into patches and treating each patch as a token.
        </p>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Step n={1} label="Image → patches (each patch = 1 token)" active={step >= 0} />
        <Step n={2} label="Patches projected to embeddings (d_model)" active={step >= 1} />
        <Step n={3} label="Transformer runs on patch tokens" active={step >= 2} />
      </div>

      {/* Image / patch grid */}
      <div>
        <div style={{ fontSize: 9, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {uploadedColors ? 'Uploaded image (4×4 patches)' : 'Demo image — 16 colourful patches'}
          {' '}· hover a patch to see its attention
        </div>

        {/* Patch grid */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{ display: 'inline-block', border: '2px solid #1e293b', borderRadius: 4, overflow: 'hidden', position: 'relative' }}
        >
          {Array.from({ length: GRID }, (_, row) => (
            <div key={row} style={{ display: 'flex' }}>
              {Array.from({ length: GRID }, (_, col) => {
                const idx = row * GRID + col;
                const attnW = displayAttn[idx] ?? 0;
                const isHovered = hoveredPatch === idx;
                return (
                  <div
                    key={col}
                    onMouseEnter={() => setHover(idx)}
                    onMouseLeave={() => setHover(null)}
                    title={`Patch ${idx + 1} · attn: ${attnW.toFixed(3)}`}
                    style={{
                      width: CELL, height: CELL,
                      background: patchHexColors[idx],
                      position: 'relative',
                      border: isHovered ? '2px solid #facc15' : '1px solid rgba(0,0,0,0.2)',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Attention overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: attnColor(attnW, maxAttn),
                      transition: 'background 0.2s',
                    }} />
                    {/* Patch index */}
                    <div style={{
                      position: 'absolute', top: 2, left: 3,
                      fontSize: 8, color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'monospace', fontWeight: 700,
                    }}>P{idx + 1}</div>
                    {/* Attention weight */}
                    <div style={{
                      position: 'absolute', bottom: 2, right: 3,
                      fontSize: 8, color: 'rgba(255,255,255,0.85)',
                      fontFamily: 'monospace', fontWeight: 700,
                    }}>
                      {(attnW * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Attention label */}
        <div style={{ fontSize: 9, color: '#475569', marginTop: 5 }}>
          {hoveredPatch !== null
            ? `Patch ${hoveredPatch + 1}'s attention to other patches (Head 1, Layer 1)`
            : '[CLS] token attention to each patch — brighter = more important'}
        </div>
      </div>

      {/* Upload button */}
      <div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '6px 14px', borderRadius: 6,
            border: '1px solid #334155', background: 'none',
            color: '#94a3b8', cursor: 'pointer', fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          📷 Upload your own image
          <span style={{ fontSize: 9, color: '#475569' }}>or drag & drop onto grid</span>
        </button>
        {uploadedColors && (
          <button
            onClick={() => { setUploaded(null); setUploadedGrid(null); }}
            style={{
              marginLeft: 8, padding: '6px 10px', borderRadius: 6,
              border: '1px solid #334155', background: 'none',
              color: '#64748b', cursor: 'pointer', fontSize: 10,
            }}
          >
            Reset demo
          </button>
        )}
      </div>

      {/* Step nav */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Patches', 'Embeddings', 'Attention'].map((label, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none',
              background: step === i ? '#6366f1' : '#1e293b',
              color: step === i ? '#fff' : '#475569',
              cursor: 'pointer', fontSize: 10, fontWeight: step === i ? 700 : 400,
            }}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8' }}>What's happening:</div>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            A 224×224 image is divided into a grid of <strong style={{ color: '#f1f5f9' }}>16×16 pixel patches</strong>.
            Each patch is a small square region — just like a word is a small chunk of text.
            Here we use a 4×4 grid (16 patches) for simplicity.
          </p>
          <div style={{
            background: '#0f172a', borderRadius: 8, padding: '8px 10px',
            display: 'flex', gap: 10, fontSize: 10,
          }}>
            <div style={{ color: '#475569' }}>Text:</div>
            <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>"the cat sat" → [the] [cat] [sat]</div>
          </div>
          <div style={{
            background: '#0f172a', borderRadius: 8, padding: '8px 10px',
            display: 'flex', gap: 10, fontSize: 10,
          }}>
            <div style={{ color: '#475569' }}>Image:</div>
            <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>🖼 → [P1] [P2] [P3] … [P16]</div>
          </div>
          <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
            A special <strong style={{ color: '#facc15' }}>[CLS]</strong> token is prepended.
            After all transformer layers, the [CLS] output represents the whole image — used for classification.
          </p>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8' }}>Patch → Embedding:</div>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            Each patch is flattened into a vector (pixels × channels), then multiplied by a
            <strong style={{ color: '#f1f5f9' }}> patch projection matrix W</strong> to get a d_model-dimensional embedding.
          </p>
          <div style={{
            background: '#0f172a', borderRadius: 8, padding: '8px 10px',
            fontFamily: 'monospace', fontSize: 10, color: '#64748b',
          }}>
            <div style={{ color: '#94a3b8' }}>patch_flat = [R, G, B]  <span style={{ color: '#475569' }}>// simplified (mean RGB)</span></div>
            <div style={{ color: '#818cf8', marginTop: 4 }}>embed = patch_flat @ W_patch  <span style={{ color: '#475569' }}>// shape: d_model={modelConfig.d_model}</span></div>
            <div style={{ color: '#34d399', marginTop: 4 }}>embed += positional_encoding(position)</div>
          </div>
          <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
            After this step, every patch token has the same shape as a word token.
            The transformer doesn't know (or care) whether it's processing text or image patches!
          </p>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8' }}>Attention across patches:</div>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            The transformer runs <strong>full (bidirectional) attention</strong> on all 17 tokens (1 CLS + 16 patches).
            Every patch can attend to every other patch — vision doesn't need causal masking.
          </p>
          <div style={{
            background: '#1a1a2e', border: '1px solid #4338ca44',
            borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#a5b4fc', lineHeight: 1.7,
          }}>
            <div>Hover patches above to see their attention patterns.</div>
            <div style={{ marginTop: 4, color: '#6366f1' }}>
              [CLS] attention (default) shows which patches the model finds most "interesting".
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.6 }}>
            Real-world ViT models (ViT-B/16, CLIP, LLaVA) use 196 patches from a 224×224 image
            (14×14 grid of 16×16px patches). The math is identical — just more tokens.
          </div>
        </div>
      )}

      {/* Real-world connections */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
          This powers:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            ['🔬 ViT', "Google's Vision Transformer — images as patches for classification"],
            ['🔗 CLIP', 'OpenAI — aligns image patches with text tokens in shared space'],
            ['💬 LLaVA', 'Visual Q&A — patch tokens + text tokens fed to same LLM'],
            ['🎨 Stable Diffusion', 'Latent diffusion model uses transformer on image patches'],
          ].map(([name, desc]) => (
            <div key={name} style={{ display: 'flex', gap: 8, fontSize: 10 }}>
              <span style={{ color: '#818cf8', flexShrink: 0, width: 80 }}>{name}</span>
              <span style={{ color: '#475569' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
