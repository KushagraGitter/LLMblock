import { create } from 'zustand';
import { tokenize, topK, idToToken, EOS_ID, PAD_ID } from '../lib/tokenizer.js';
import { runPipeline, computeLogitLens } from '../lib/transformer.js';
import { createWeights, MODEL_PRESETS, DEFAULT_CONFIG, defaultWeights, countParams } from '../lib/weights.js';
import { VOCAB_SIZE } from '../lib/tokenizer.js';

const DEFAULT_TEXT = 'the transformer model uses attention';

// Safe localStorage helper (guards against SSR / private-browsing errors)
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

// Module-level mutable weights (recreated when arch changes)
let _weights = defaultWeights;

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyTemperature(probs, temperature) {
  if (temperature === 1) return probs;
  const logits = probs.map(p => Math.log(Math.max(p, 1e-10)) / temperature);
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0) + 1e-10;
  return exps.map(e => e / sum);
}

function sampleFromProbs(probs) {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.length - 1;
}

function runOnce(text, config) {
  const tokens   = tokenize(text);
  const ids      = tokens.map(t => t.id).slice(0, config.max_seq);
  const clipped  = tokens.slice(0, config.max_seq);

  const result = runPipeline(
    ids,
    _weights.embeddingMatrix,
    _weights.layerWeights,
    _weights.finalLnGamma,
    _weights.finalLnBeta,
    _weights.outputProjection,
    _weights.outputBias,
    config.n_heads,
  );

  const lens = computeLogitLens(result, _weights.outputProjection, _weights.outputBias)
    .map(l => ({ ...l, top5: topK(l.probs, 5) }));

  return { tokens: clipped, result, lens, top: topK(result.probs, 12) };
}

// ── Store ─────────────────────────────────────────────────────────────────────

const useTransformerStore = create((set, get) => ({

  // ── Model Architecture ─────────────────────────────────────────────────────
  modelConfig: DEFAULT_CONFIG,
  paramCount: countParams(DEFAULT_CONFIG),
  setModelConfig: (newConfig) => {
    const cfg = { ...newConfig, vocab_size: VOCAB_SIZE };
    _weights = createWeights(cfg);
    set({
      modelConfig: cfg,
      paramCount: countParams(cfg),
      hasRun: false,
      pipelineResult: null,
      tokens: [],
      logitLens: null,
      topTokens: [],
      generatedTokens: [],
    });
  },

  // ── Input ──────────────────────────────────────────────────────────────────
  inputText: DEFAULT_TEXT,
  setInputText: (text) => set({ inputText: text }),

  // ── Run state ──────────────────────────────────────────────────────────────
  isRunning: false,
  hasRun: false,

  // ── Pipeline outputs ───────────────────────────────────────────────────────
  tokens: [],
  pipelineResult: null,
  topTokens: [],
  logitLens: null,

  // ── Generation ─────────────────────────────────────────────────────────────
  isGenerating: false,
  generatedTokens: [],   // [{token, id, prob}]
  temperature: 0.8,
  maxGenTokens: 15,
  setTemperature: (t) => set({ temperature: t }),
  setMaxGenTokens: (n) => set({ maxGenTokens: n }),

  // ── UI ─────────────────────────────────────────────────────────────────────
  selectedNodeId: null,
  selectedLayerIdx: 0,
  rightPanelTab: 'inspector',   // 'inspector' | 'logitLens' | 'embedSpace'
  showArchModal: false,
  showGenPanel: false,
  tourHighlightId: null,        // nodeIdPrefix currently highlighted by guided tour
  showOnboarding: !lsGet('llmblock_onboarded'),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedLayerIdx: (i) => set({ selectedLayerIdx: i }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setShowArchModal: (v) => set({ showArchModal: v }),
  setShowGenPanel: (v) => set({ showGenPanel: v }),
  setTourHighlightId: (id) => set({ tourHighlightId: id }),
  setShowOnboarding: (v) => {
    if (!v) lsSet('llmblock_onboarded', '1');
    set({ showOnboarding: v });
  },

  // ── Run once ───────────────────────────────────────────────────────────────
  run: () => {
    const { inputText, modelConfig } = get();
    if (!inputText.trim()) return;
    set({ isRunning: true });

    setTimeout(() => {
      const { tokens, result, lens, top } = runOnce(inputText, modelConfig);
      set({
        tokens,
        pipelineResult: result,
        topTokens: top,
        logitLens: lens,
        isRunning: false,
        hasRun: true,
      });
    }, 30);
  },

  // ── Autoregressive generation ──────────────────────────────────────────────
  generate: () => {
    const { inputText, maxGenTokens, temperature, modelConfig } = get();
    if (!inputText.trim()) return;

    set({ isGenerating: true, generatedTokens: [], hasRun: true, showGenPanel: true });

    let currentText = inputText;
    let step = 0;

    const doStep = () => {
      // Check if stopped by user
      if (!get().isGenerating) return;
      if (step >= maxGenTokens) {
        set({ isGenerating: false });
        return;
      }

      const { tokens, result, lens, top } = runOnce(currentText, modelConfig);

      // Sample with temperature
      const sampledProbs = applyTemperature(result.probs, temperature);
      const sampledId    = sampleFromProbs(sampledProbs);
      const sampledToken = idToToken[sampledId] ?? '<UNK>';
      const sampledProb  = sampledProbs[sampledId];

      // Stop on EOS / PAD
      if (sampledId === EOS_ID || sampledId === PAD_ID) {
        set({ isGenerating: false });
        return;
      }

      currentText = currentText + ' ' + sampledToken;
      step++;

      set(state => ({
        inputText: currentText,
        tokens,
        pipelineResult: result,
        topTokens: top,
        logitLens: lens,
        generatedTokens: [
          ...state.generatedTokens,
          { token: sampledToken, id: sampledId, prob: sampledProb },
        ],
      }));

      setTimeout(doStep, 350);
    };

    setTimeout(doStep, 30);
  },

  stopGeneration: () => set({ isGenerating: false }),

  resetGeneration: () => {
    const { inputText } = get();
    // Strip back to original (before generated tokens)
    set({ generatedTokens: [], isGenerating: false });
  },
}));

export default useTransformerStore;
