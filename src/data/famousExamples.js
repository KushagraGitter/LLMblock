/**
 * Curated sentences that each demonstrate a specific concept in transformer attention.
 * Each example has:
 *  - sentence    : text to load into the pipeline
 *  - concept     : short label
 *  - icon
 *  - colour
 *  - explanation : what a TRAINED model would show, and why
 *  - lookFor     : what the user can observe even with toy weights
 *  - spotlight   : [word, word] pair whose attention is most interesting
 */
export const FAMOUS_EXAMPLES = [
  {
    id: 'disambiguation',
    concept: 'Word Disambiguation',
    icon: '🏦',
    colour: '#3b82f6',
    sentence: 'the bank was steep because the river was fast',
    explanation:
      'The word "bank" is ambiguous — it can mean a financial institution or a river bank. ' +
      'A trained model resolves this by attending strongly from "bank" to "river" and "steep", ' +
      'effectively voting: this is the river sense, not the financial sense.',
    lookFor:
      'Open the Attention block. In head 1, look for "bank" (row) attending to "river" (column). ' +
      'This cross-token link is how context resolves ambiguity.',
    spotlight: ['bank', 'river'],
  },
  {
    id: 'pronoun',
    concept: 'Pronoun Resolution',
    icon: '🏆',
    colour: '#8b5cf6',
    sentence: 'the trophy did not fit because it was too big',
    explanation:
      'Classic Winograd Schema. What does "it" refer to — the trophy or something else? ' +
      'A trained model attends from "it" back to "trophy", resolving the coreference. ' +
      'This is hard even for humans to explain the rules of, yet transformers learn it.',
    lookFor:
      'Watch which token "it" attends to most strongly. In a trained model it binds to "trophy". ' +
      'The attention map visualises this pronoun–antecedent link.',
    spotlight: ['it', 'trophy'],
  },
  {
    id: 'factual',
    concept: 'Factual Knowledge',
    icon: '🗼',
    colour: '#10b981',
    sentence: 'paris is the capital of',
    explanation:
      'FFN layers (not attention) store most factual knowledge. When a trained model sees ' +
      '"Paris… capital of", the FFN layers recall "France" from parametric memory and boost ' +
      'its probability in the output distribution — even without any context clue.',
    lookFor:
      'After running, open the Output block. With random weights you\'ll see random tokens. ' +
      'With a trained model "france" and "French" would dominate. This shows where world ' +
      'knowledge lives: in the FFN weights, not in the attention pattern.',
    spotlight: ['paris', 'capital'],
  },
  {
    id: 'subject_verb',
    concept: 'Subject–Verb Agreement',
    icon: '📚',
    colour: '#f59e0b',
    sentence: 'the keys to the cabinet are on the table',
    explanation:
      '"Keys" (plural) is the true subject, but "cabinet" sits between it and the verb. ' +
      'A trained model attends from "are" back to "keys" — skipping the distracting noun — ' +
      'demonstrating that attention learns syntactic structure, not just surface proximity.',
    lookFor:
      'In the attention map, check whether the verb "are" attends back to "keys" rather ' +
      'than to the closer "cabinet". This is attention learning syntax.',
    spotlight: ['are', 'keys'],
  },
  {
    id: 'sentiment',
    concept: 'Sentiment & Negation',
    icon: '😤',
    colour: '#ef4444',
    sentence: 'the movie was not good at all',
    explanation:
      'Negation completely flips sentiment. A trained model learns that "not" modifies "good", ' +
      'and attention from "good" to "not" propagates the negative signal. ' +
      'This is why "not bad" and "bad" produce very different next-token distributions.',
    lookFor:
      'Find "not" and "good" in the attention map. Are they attending to each other? ' +
      'The residual stream accumulates this negation signal across layers.',
    spotlight: ['not', 'good'],
  },
  {
    id: 'long_range',
    concept: 'Long-Range Dependency',
    icon: '🔭',
    colour: '#a78bfa',
    sentence: 'the scientist who studied the ancient cells discovered that they divide rapidly',
    explanation:
      '"They" refers to "cells", not to "scientist" — a long-range dependency across 7 tokens. ' +
      'Transformers handle this in O(1) steps (one attention pass), whereas RNNs had to ' +
      'propagate the information step by step, often forgetting it.',
    lookFor:
      'Check whether "they" attends to "cells" rather than the closer "scientist". ' +
      'This demonstrates O(1) long-range attention — the key advantage over RNNs.',
    spotlight: ['they', 'cells'],
  },
  {
    id: 'induction',
    concept: 'Induction / Copying',
    icon: '🔄',
    colour: '#22d3ee',
    sentence: 'the cat sat on the mat the cat',
    explanation:
      'Induction heads copy recent patterns. When the model sees "the cat" appear twice, ' +
      'certain attention heads (called induction heads) detect the repetition and predict ' +
      'that "sat" will likely follow — the same token that followed "cat" before.',
    lookFor:
      'Run and look at later-layer attention heads. Some heads may show a diagonal-shifted ' +
      'pattern — this is induction: attending to the previous occurrence of the current token.',
    spotlight: ['cat', 'sat'],
  },
];
