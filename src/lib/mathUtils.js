/**
 * Core mathematical operations for the Transformer pipeline.
 * All matrices are plain JS arrays of arrays: M[row][col]
 */

/** Matrix multiplication: A (m×k) × B (k×n) → C (m×n) */
export function matmul(A, B) {
  const m = A.length;
  const k = B.length;
  const n = B[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let p = 0; p < k; p++)
      for (let j = 0; j < n; j++)
        C[i][j] += A[i][p] * B[p][j];
  return C;
}

/** Matrix transpose */
export function transpose(A) {
  const rows = A.length, cols = A[0].length;
  return Array.from({ length: cols }, (_, j) =>
    Array.from({ length: rows }, (_, i) => A[i][j])
  );
}

/** Row-wise softmax (works on 1-D or 2-D) */
export function softmax(x) {
  if (!Array.isArray(x[0])) {
    const max = Math.max(...x);
    const exps = x.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0) + 1e-10;
    return exps.map(v => v / sum);
  }
  return x.map(row => softmax(row));
}

/** Layer normalisation along last axis */
export function layerNorm(x, gamma, beta, eps = 1e-5) {
  return x.map(row => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance + eps);
    return row.map((v, i) => gamma[i] * ((v - mean) / std) + beta[i]);
  });
}

/** GELU activation */
export function gelu(x) {
  if (Array.isArray(x[0])) return x.map(row => gelu(row));
  return x.map(v =>
    0.5 * v * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (v + 0.044715 * v ** 3)))
  );
}

/** Element-wise matrix addition */
export function add(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

/** Scale matrix by scalar */
export function scaleMatrix(A, s) {
  return A.map(row => row.map(v => v * s));
}

/** Add bias vector to each row of a matrix */
export function addBias(M, b) {
  return M.map(row => row.map((v, j) => v + b[j]));
}

/** Min-max normalize a flat or 2-D array to [0,1] for visualisation */
export function normalizeMatrix(M) {
  const flat = M.flat ? M.flat() : M;
  let min = Infinity, max = -Infinity;
  for (const v of flat) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min || 1;
  if (!Array.isArray(M[0])) return flat.map(v => (v - min) / range);
  return M.map(row => row.map(v => (v - min) / range));
}

/** Seeded LCG pseudo-random number generator (for reproducible weights) */
export function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Create a (rows × cols) matrix with seeded random values in [-scale, scale] */
export function randomMatrix(rows, cols, seed, sc = 0.1) {
  const rng = seededRng(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rng() - 0.5) * 2 * sc)
  );
}

/** Create a vector of length n filled with value */
export function filledVector(n, value = 0) {
  return new Array(n).fill(value);
}

/** Create an identity-like gamma vector (ones) */
export function onesVector(n) {
  return new Array(n).fill(1);
}
