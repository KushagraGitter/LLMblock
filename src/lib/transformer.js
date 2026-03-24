/**
 * Full transformer forward pass with per-stage intermediate outputs
 * for visualisation in the node editor.
 * All functions receive the model config explicitly — no global state.
 */

import {
  matmul, transpose, softmax, layerNorm, gelu,
  add, scaleMatrix, addBias, normalizeMatrix,
} from './mathUtils.js';

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
  const d_k = Q[0].length;
  const scores = scaleMatrix(matmul(Q, transpose(K)), 1 / Math.sqrt(d_k));
  const weights = softmax(scores);
  const output = matmul(weights, V);
  return { output, weights };
}

/**
 * Multi-head attention.
 * Returns { output, headWeights } where headWeights[h] is (seq × seq).
 */
export function multiHeadAttention(x, attnWeights, nHeads) {
  const seqLen = x.length;
  const dModel = x[0].length;
  const dHead = Math.floor(dModel / nHeads);

  const Q = matmul(x, attnWeights.Wq);
  const K = matmul(x, attnWeights.Wk);
  const V = matmul(x, attnWeights.Wv);

  const headOutputs = [];
  const headWeights = [];

  for (let h = 0; h < nHeads; h++) {
    const s = h * dHead;
    const e = s + dHead;
    const { output, weights } = sdpAttention(
      Q.map(r => r.slice(s, e)),
      K.map(r => r.slice(s, e)),
      V.map(r => r.slice(s, e)),
    );
    headOutputs.push(output);
    headWeights.push(weights);
  }

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

export function transformerBlock(x, weights, nHeads) {
  const normed1 = layerNorm(x, weights.ln1_gamma, weights.ln1_beta);
  const { output: attnOut, headWeights } = multiHeadAttention(normed1, weights.attn, nHeads);
  const afterAttn = add(x, attnOut);

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

export function runPipeline(tokenIds, embeddingMatrix, layerWeightsArr, finalLnGamma, finalLnBeta, outputProjection, outputBias, nHeads) {
  const seqLen = tokenIds.length;
  const dModel = embeddingMatrix[0].length;

  const embeddings = tokenIds.map(id => [...embeddingMatrix[id]]);
  const pe = positionalEncoding(seqLen, dModel);
  const embedWithPE = add(embeddings, pe);

  const blockResults = [];
  let hidden = embedWithPE;

  for (const weights of layerWeightsArr) {
    const result = transformerBlock(hidden, weights, nHeads);
    blockResults.push(result);
    hidden = result.output;
  }

  const finalNormed = layerNorm(hidden, finalLnGamma, finalLnBeta);

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
    embedNorm: normalizeMatrix(embeddings),
    peNorm: normalizeMatrix(pe),
    embedWithPENorm: normalizeMatrix(embedWithPE),
  };
}

// ── Logit Lens ───────────────────────────────────────────────────────────────

/**
 * Computes next-token probabilities at each intermediate layer
 * by projecting the hidden state directly to vocab at each stage.
 * Returns [{ label, probs }] from Embed+PE → Layer 1 → … → Final LN.
 */
export function computeLogitLens(pipelineResult, outputProjection, outputBias) {
  const { embedWithPE, blockResults } = pipelineResult;

  const stages = [
    { label: 'Embed+PE', hidden: embedWithPE },
    ...blockResults.map((r, i) => ({ label: `Layer ${i + 1}`, hidden: r.output })),
  ];

  return stages.map(({ label, hidden }) => {
    const last = hidden[hidden.length - 1];
    const logits = outputProjection[0].map((_, j) =>
      last.reduce((s, v, i) => s + v * outputProjection[i][j], 0) + outputBias[j]
    );
    return { label, probs: softmax(logits) };
  });
}
