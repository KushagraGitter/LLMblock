/**
 * Full transformer forward pass with per-stage intermediate outputs
 * for visualisation in the node editor.
 */

import {
  matmul, transpose, softmax, layerNorm, gelu,
  add, scaleMatrix, addBias, normalizeMatrix,
} from './mathUtils.js';
import { MODEL_CONFIG } from './weights.js';

const { n_heads, d_head } = MODEL_CONFIG;

// ── Positional Encoding ──────────────────────────────────────────────────────

/** Sinusoidal positional encoding: shape (seq_len × d_model) */
export function positionalEncoding(seqLen, dModel) {
  return Array.from({ length: seqLen }, (_, pos) =>
    Array.from({ length: dModel }, (_, i) => {
      const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
      return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
    })
  );
}

// ── Attention ────────────────────────────────────────────────────────────────

/** Scaled dot-product attention for a single head */
function sdpAttention(Q, K, V) {
  const scale = 1 / Math.sqrt(d_head);
  const scores = scaleMatrix(matmul(Q, transpose(K)), scale);
  const weights = softmax(scores);          // (seq × seq)
  const output = matmul(weights, V);        // (seq × d_head)
  return { output, weights };
}

/**
 * Multi-head attention.
 * Returns { output, headWeights } where headWeights[h] is (seq × seq).
 */
export function multiHeadAttention(x, attnWeights) {
  const seqLen = x.length;
  const dModel = x[0].length;

  const Q = matmul(x, attnWeights.Wq);   // (seq × d_model)
  const K = matmul(x, attnWeights.Wk);
  const V = matmul(x, attnWeights.Wv);

  const headOutputs = [];
  const headWeights = [];

  for (let h = 0; h < n_heads; h++) {
    const s = h * d_head;
    const e = s + d_head;
    const Q_h = Q.map(r => r.slice(s, e));
    const K_h = K.map(r => r.slice(s, e));
    const V_h = V.map(r => r.slice(s, e));

    const { output, weights } = sdpAttention(Q_h, K_h, V_h);
    headOutputs.push(output);
    headWeights.push(weights);
  }

  // Concat heads → (seq × d_model) then project
  const concat = Array.from({ length: seqLen }, (_, i) =>
    headOutputs.flatMap(h => h[i])
  );
  const output = matmul(concat, attnWeights.Wo);

  return { output, headWeights };
}

// ── Feed-Forward Network ─────────────────────────────────────────────────────

export function ffn(x, ffnWeights) {
  const hidden = gelu(addBias(matmul(x, ffnWeights.W1), ffnWeights.b1));
  return addBias(matmul(hidden, ffnWeights.W2), ffnWeights.b2);
}

// ── Single Transformer Block ─────────────────────────────────────────────────

export function transformerBlock(x, weights) {
  // Pre-norm → Attention → Residual
  const normed1 = layerNorm(x, weights.ln1_gamma, weights.ln1_beta);
  const { output: attnOut, headWeights } = multiHeadAttention(normed1, weights.attn);
  const afterAttn = add(x, attnOut);

  // Pre-norm → FFN → Residual
  const normed2 = layerNorm(afterAttn, weights.ln2_gamma, weights.ln2_beta);
  const ffnOut = ffn(normed2, weights.ffn);
  const output = add(afterAttn, ffnOut);

  return {
    output,
    headWeights,
    intermediate: { normed1, attnOut, afterAttn, normed2, ffnOut },
  };
}

// ── Full Pipeline ────────────────────────────────────────────────────────────

/**
 * Run the complete transformer pipeline and return rich intermediate state
 * for every stage so each visualisation node can display its data.
 */
export function runPipeline(tokenIds, embeddingMatrix, layerWeightsArr, finalLnGamma, finalLnBeta, outputProjection, outputBias) {
  const seqLen = tokenIds.length;
  const dModel = embeddingMatrix[0].length;

  // 1. Embedding lookup
  const embeddings = tokenIds.map(id => [...embeddingMatrix[id]]);

  // 2. Positional encoding
  const pe = positionalEncoding(seqLen, dModel);
  const embedWithPE = add(embeddings, pe);

  // 3. Transformer blocks
  const blockResults = [];
  let hidden = embedWithPE;

  for (const weights of layerWeightsArr) {
    const result = transformerBlock(hidden, weights);
    blockResults.push(result);
    hidden = result.output;
  }

  // 4. Final layer norm
  const finalNormed = layerNorm(hidden, finalLnGamma, finalLnBeta);

  // 5. Linear projection → logits for last token
  const lastHidden = finalNormed[finalNormed.length - 1];
  const logits = outputProjection[0].map((_, j) =>
    lastHidden.reduce((s, v, i) => s + v * outputProjection[i][j], 0) + outputBias[j]
  );
  const probs = softmax(logits);

  return {
    tokenIds,
    embeddings,
    pe,
    embedWithPE,
    blockResults,
    finalNormed,
    logits,
    probs,
    // Normalised versions for heatmaps
    embedNorm: normalizeMatrix(embeddings),
    peNorm: normalizeMatrix(pe),
    embedWithPENorm: normalizeMatrix(embedWithPE),
  };
}
