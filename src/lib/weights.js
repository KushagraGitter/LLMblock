/**
 * Initialises all transformer weights with seeded random values.
 * Using fixed seeds ensures deterministic, reproducible outputs.
 *
 * Model config:
 *   vocab_size : from tokenizer
 *   d_model    : 32
 *   n_heads    : 4   (d_head = 8)
 *   d_ff       : 128
 *   n_layers   : 2
 */

import { randomMatrix, filledVector, onesVector } from './mathUtils.js';
import { VOCAB_SIZE } from './tokenizer.js';

export const MODEL_CONFIG = {
  vocab_size: VOCAB_SIZE,
  d_model: 32,
  n_heads: 4,
  d_head: 8,        // d_model / n_heads
  d_ff: 128,
  n_layers: 2,
  max_seq: 24,
};

const { vocab_size, d_model, n_heads, d_head, d_ff, n_layers } = MODEL_CONFIG;

// ── Embedding & output weights ──────────────────────────────────────────────

export const embeddingMatrix = randomMatrix(vocab_size, d_model, 42, 0.15);

export const outputProjection = randomMatrix(d_model, vocab_size, 99, 0.1);
export const outputBias = filledVector(vocab_size, 0);

// ── Per-layer weights ────────────────────────────────────────────────────────

function makeLayerWeights(layerIdx) {
  const base = layerIdx * 1000;
  return {
    // Layer norm 1 (pre-attention)
    ln1_gamma: onesVector(d_model),
    ln1_beta: filledVector(d_model, 0),
    // Multi-head attention projections
    attn: {
      Wq: randomMatrix(d_model, d_model, base + 1, 0.1),
      Wk: randomMatrix(d_model, d_model, base + 2, 0.1),
      Wv: randomMatrix(d_model, d_model, base + 3, 0.1),
      Wo: randomMatrix(d_model, d_model, base + 4, 0.1),
    },
    // Layer norm 2 (pre-FFN)
    ln2_gamma: onesVector(d_model),
    ln2_beta: filledVector(d_model, 0),
    // Feed-forward network
    ffn: {
      W1: randomMatrix(d_model, d_ff, base + 5, 0.1),
      b1: filledVector(d_ff, 0),
      W2: randomMatrix(d_ff, d_model, base + 6, 0.1),
      b2: filledVector(d_model, 0),
    },
  };
}

export const layerWeights = Array.from({ length: n_layers }, (_, i) =>
  makeLayerWeights(i)
);

// Final layer norm
export const finalLnGamma = onesVector(d_model);
export const finalLnBeta = filledVector(d_model, 0);
