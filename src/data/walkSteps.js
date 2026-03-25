/**
 * Walk-through step definitions for the canvas learning mode.
 * getWalkSteps(nLayers) returns an array adapted to the current model config.
 */

const BASE_STEPS = [
  {
    nodeId: 'tokenizer-1',
    title: 'Step 1 · Tokenizer',
    emoji: '✂️',
    color: '#3b82f6',
    summary: 'Raw text → numbered word-pieces',
    explain:
      'Your sentence is chopped into small chunks called "tokens". Words get split at their boundaries (sometimes into sub-word pieces: "unbelievable" → ["un","believ","able"]). Each chunk is mapped to a unique number ID from the model\'s vocabulary.',
    notice: 'Each colored chip is one token. Hover it to see its ID number.',
    analogy: 'Think of it as breaking a sentence into Scrabble tiles — each tile has a face (the word) and a number stamped on the back (the ID).',
  },
  {
    nodeId: 'embedding-1',
    title: 'Step 2 · Embedding Lookup',
    emoji: '📦',
    color: '#8b5cf6',
    summary: 'Token IDs → rich meaning vectors',
    explain:
      'Each token ID is looked up in a giant table (the embedding matrix). ID 42 → a list of 32 numbers encoding the "meaning" of that token. Words with similar meanings end up with similar number patterns. The model learns these during training.',
    notice: 'The heatmap shows one row per token. Each column is one "dimension of meaning" — the pattern of bright/dark cells is the token\'s fingerprint.',
    analogy: 'Like a dictionary where each word has not a text definition but a 32-number personality profile.',
  },
  {
    nodeId: 'positional-1',
    title: 'Step 3 · Positional Encoding',
    emoji: '📍',
    color: '#c084fc',
    summary: 'Inject word ORDER so tokens know their position',
    explain:
      'Transformers process all tokens simultaneously — unlike RNNs they have no built-in sense of order. So we add a unique wave pattern (sine + cosine) to each position\'s embedding. Position 0 gets one fingerprint, position 1 gets another. The model learns to read these patterns as "I am word number N".',
    notice: 'Notice the wave pattern in the heatmap — each row (position) has a unique signature. Without this, "cat sat" and "sat cat" would look identical.',
    analogy: 'Like numbering seats in a cinema — the film (token) is the same but the seat number (position) tells you where it belongs.',
  },
];

function layerStep(i, totalSteps) {
  const isFirst = i === 0;
  return {
    nodeId: `transformerBlock-${i + 1}`,
    title: `Step ${i + 4} · Transformer Block (Layer ${i + 1})`,
    emoji: '🧱',
    color: '#818cf8',
    summary: isFirst
      ? 'Context flows between ALL tokens simultaneously'
      : 'A deeper round of contextual refinement',
    explain: isFirst
      ? 'Three sub-steps run in sequence:\n\n① ATTENTION — every token looks at every other token to gather context. The word "bank" near "river" updates its meaning by attending to "river".\n\n② RESIDUAL — the original input is added back (a "skip connection"). This lets early features survive deep networks without degrading.\n\n③ FFN — a small 2-layer neural network transforms each token independently, adding capacity for complex patterns.'
      : `Layer ${i + 1} operates on richer representations that already encode context from layer ${i}. Early layers typically capture syntax (grammar), later layers capture higher-level semantics (meaning, coreference). More layers = more abstraction.`,
    notice: isFirst
      ? 'The attention heatmap shows which tokens pay attention to which others. Bright = strong connection. Notice which words pull attention toward each other.'
      : `Compare the attention pattern here to Layer ${i}. Later layers often show more focused, semantically meaningful attention patterns.`,
    analogy: isFirst
      ? 'Like a study group — each student first listens to everyone else\'s ideas, then updates their own notes with the collective wisdom.'
      : 'Like a second (or third) draft of an essay — you\'re refining ideas already refined before.',
  };
}

const OUTPUT_STEP = {
  nodeId: 'output-1',
  title: 'Final Step · Output Projection',
  emoji: '🎯',
  color: '#10b981',
  summary: 'Hidden state → probability over every word in the vocabulary',
  explain:
    'The last token\'s hidden state (a d_model-dim vector) is multiplied by the output projection matrix (d_model × vocab_size). This produces a "logit score" for every word in the vocabulary. Softmax converts scores to probabilities summing to 1. The highest-probability word is the model\'s prediction for the next word.',
  notice:
    'The green bar is the model\'s best guess for the next token. With random weights the prediction is meaningless — but with real GPT-2 weights this would be a genuine, coherent prediction.',
  analogy:
    'Like a student scoring 256 multiple-choice answers simultaneously — the output matrix is the answer key, and softmax picks the most confident answer.',
};

export function getWalkSteps(nLayers = 2) {
  const steps = [...BASE_STEPS];
  for (let i = 0; i < nLayers; i++) steps.push(layerStep(i, nLayers));
  steps.push(OUTPUT_STEP);
  return steps;
}
