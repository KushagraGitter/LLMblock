/**
 * Dynamic weight initialisation.
 * createWeights(config) returns all model parameters for a given config.
 * MODEL_PRESETS provides named architecture shapes.
 */

import { randomMatrix, filledVector, onesVector } from './mathUtils.js';
import { VOCAB_SIZE } from './tokenizer.js';

export const MODEL_PRESETS = {
  nano:  { d_model: 32,  n_heads: 4, d_ff: 128, n_layers: 2, max_seq: 24,  label: 'Nano'  },
  micro: { d_model: 64,  n_heads: 4, d_ff: 256, n_layers: 2, max_seq: 32,  label: 'Micro' },
  small: { d_model: 128, n_heads: 8, d_ff: 512, n_layers: 4, max_seq: 64,  label: 'Small' },
  tiny:  { d_model: 16,  n_heads: 2, d_ff: 64,  n_layers: 1, max_seq: 16,  label: 'Tiny'  },
};

export function countParams(config) {
  const { d_model, n_heads, d_ff, n_layers } = config;
  const vocab = VOCAB_SIZE;
  const embed = vocab * d_model;
  const attnPerLayer = 4 * d_model * d_model;   // Wq, Wk, Wv, Wo
  const ffnPerLayer  = d_model * d_ff + d_ff + d_ff * d_model + d_model;
  const lnPerLayer   = 2 * d_model * 2;          // two LNs per block
  const total = embed + n_layers * (attnPerLayer + ffnPerLayer + lnPerLayer) + d_model * vocab;
  return total;
}

export function createWeights(config) {
  const { d_model, n_heads, d_ff, n_layers } = config;

  const embeddingMatrix  = randomMatrix(VOCAB_SIZE, d_model, 42, 0.15);
  const outputProjection = randomMatrix(d_model, VOCAB_SIZE, 99, 0.1);
  const outputBias       = filledVector(VOCAB_SIZE, 0);
  const finalLnGamma     = onesVector(d_model);
  const finalLnBeta      = filledVector(d_model, 0);

  const layerWeights = Array.from({ length: n_layers }, (_, li) => {
    const base = li * 1000;
    return {
      ln1_gamma: onesVector(d_model),
      ln1_beta:  filledVector(d_model, 0),
      attn: {
        Wq: randomMatrix(d_model, d_model, base + 1, 0.1),
        Wk: randomMatrix(d_model, d_model, base + 2, 0.1),
        Wv: randomMatrix(d_model, d_model, base + 3, 0.1),
        Wo: randomMatrix(d_model, d_model, base + 4, 0.1),
      },
      ln2_gamma: onesVector(d_model),
      ln2_beta:  filledVector(d_model, 0),
      ffn: {
        W1: randomMatrix(d_model, d_ff,    base + 5, 0.1),
        b1: filledVector(d_ff, 0),
        W2: randomMatrix(d_ff,  d_model,   base + 6, 0.1),
        b2: filledVector(d_model, 0),
      },
    };
  });

  return { embeddingMatrix, outputProjection, outputBias, layerWeights, finalLnGamma, finalLnBeta };
}

// Default weights for the initial render
export const DEFAULT_CONFIG = { ...MODEL_PRESETS.nano, vocab_size: VOCAB_SIZE };
export const defaultWeights = createWeights(DEFAULT_CONFIG);

// Keep MODEL_CONFIG export for any legacy references
export const MODEL_CONFIG = DEFAULT_CONFIG;
