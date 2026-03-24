import { create } from 'zustand';
import { tokenize, topK } from '../lib/tokenizer.js';
import { runPipeline } from '../lib/transformer.js';
import {
  embeddingMatrix,
  layerWeights,
  finalLnGamma,
  finalLnBeta,
  outputProjection,
  outputBias,
  MODEL_CONFIG,
} from '../lib/weights.js';

const DEFAULT_TEXT = 'the transformer model uses attention';

const useTransformerStore = create((set, get) => ({
  // ── Input ────────────────────────────────────────────────────────────────
  inputText: DEFAULT_TEXT,
  setInputText: (text) => set({ inputText: text }),

  // ── Run state ────────────────────────────────────────────────────────────
  isRunning: false,
  hasRun: false,

  // ── Pipeline outputs ─────────────────────────────────────────────────────
  tokens: [],        // [{token, id, original}]
  pipelineResult: null,  // full result from runPipeline()
  topTokens: [],     // top-k next token predictions

  // ── UI state ─────────────────────────────────────────────────────────────
  selectedNodeId: null,
  selectedHead: 0,
  selectedLayerIdx: 0,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedHead: (h) => set({ selectedHead: h }),
  setSelectedLayerIdx: (i) => set({ selectedLayerIdx: i }),

  // ── Run the full pipeline ────────────────────────────────────────────────
  run: () => {
    const { inputText } = get();
    if (!inputText.trim()) return;

    set({ isRunning: true });

    // Small async delay so UI can update
    setTimeout(() => {
      const tokens = tokenize(inputText);
      const tokenIds = tokens.map(t => t.id);

      // Limit sequence length for performance
      const maxSeq = MODEL_CONFIG.max_seq;
      const clippedIds = tokenIds.slice(0, maxSeq);
      const clippedTokens = tokens.slice(0, maxSeq);

      const result = runPipeline(
        clippedIds,
        embeddingMatrix,
        layerWeights,
        finalLnGamma,
        finalLnBeta,
        outputProjection,
        outputBias,
      );

      const top = topK(result.probs, 12);

      set({
        tokens: clippedTokens,
        pipelineResult: result,
        topTokens: top,
        isRunning: false,
        hasRun: true,
      });
    }, 50);
  },
}));

export default useTransformerStore;
