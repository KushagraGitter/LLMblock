/**
 * Plain-language explanations for every block type.
 * Written for someone with ZERO ML background.
 */

export const EXPLANATIONS = {
  tokenizer: {
    color: '#3b82f6',
    icon: '✂️',
    displayTitle: 'Tokenizer',
    tagline: 'Splits your text into a list of numbers the AI can read',
    analogy:
      'Computers can\'t read words — only numbers. The Tokenizer works like a dictionary: it looks up every word and replaces it with a unique ID number.\n\n"the cat sat" → [4, 23, 67]',
    inputLabel:  'Plain text',
    inputEx:     '"the cat sat"',
    outputLabel: 'Token IDs',
    outputEx:    '[4, 23, 67]',
    keyFact:
      'GPT-4 uses ~100,000 unique tokens — including word pieces like "un-", "-ing", so it can handle any word.',
    whyItMatters:
      'Everything downstream only sees numbers, never text. This is the bridge between human language and machine math.',
  },

  embedding: {
    color: '#6366f1',
    icon: '🗺️',
    displayTitle: 'Embedding Layer',
    tagline: 'Gives each word a location in "meaning space"',
    analogy:
      'Imagine a map where similar words live close together. "King" and "Queen" are neighbours. "Happy" and "Sad" are far apart.\n\nEach word gets a list of numbers (a vector) that captures its meaning.',
    inputLabel:  'Token IDs',
    inputEx:     '[4, 23, 67]',
    outputLabel: 'Meaning vectors',
    outputEx:    'Each word → 32 numbers',
    keyFact:
      'Famous: King − Man + Woman ≈ Queen in embedding space. Similar words have similar vectors!',
    whyItMatters:
      'A single ID number can\'t capture meaning. A vector encodes relationships — cat is close to dog, both are close to animal.',
  },

  positionalEncoding: {
    color: '#c084fc',
    icon: '📍',
    displayTitle: 'Position Encoder',
    tagline: 'Tells the model WHERE in the sentence each word appears',
    analogy:
      'Without this, "dog bites man" and "man bites dog" would look identical to the model!\n\nEach position (1st word, 2nd word, …) gets a unique pattern made from sine waves, stamped onto its vector.',
    inputLabel:  'Meaning vectors (order unknown)',
    inputEx:     '[v₁, v₂, v₃]',
    outputLabel: 'Vectors + position fingerprint',
    outputEx:    '[v₁+pe₁, v₂+pe₂, v₃+pe₃]',
    keyFact:
      'Attention looks at ALL positions at once — it has zero built-in sense of order. Position encoding injects that order.',
    whyItMatters:
      'Order matters in language. "I ate the fish" ≠ "The fish ate I". Position encoding lets the model know which word came first.',
  },

  multiHeadAttention: {
    color: '#8b5cf6',
    icon: '👁️',
    displayTitle: 'Attention',
    tagline: 'Every word looks at every other word to understand context',
    analogy:
      'Reading "The bank was steep" — you look at nearby words to know "bank" means river bank, not a money bank.\n\nAttention does the same: every word asks "which other words help explain me?" and gives them a score.',
    inputLabel:  'Word vectors',
    inputEx:     'sequence of vectors',
    outputLabel: 'Context-aware vectors',
    outputEx:    'each word now "knows" its context',
    keyFact:
      'This is the core invention of the Transformer paper (2017). GPT-3 uses 96 attention heads across 96 layers.',
    whyItMatters:
      'Context changes meaning. "I saw her duck" — did she duck down, or do I see her duck (animal)? Attention figures it out by looking at the whole sentence.',
  },

  ffn: {
    color: '#f59e0b',
    icon: '🧠',
    displayTitle: 'Feed-Forward Network',
    tagline: 'Stores and applies world knowledge',
    analogy:
      'Researchers discovered FFN layers work like a key-value memory store.\n\nWhen processing "Paris is the capital of ___", this layer recalls "France". It\'s where facts about the world are stored.',
    inputLabel:  'Context-aware vectors',
    inputEx:     'from attention layer',
    outputLabel: 'Knowledge-enriched vectors',
    outputEx:    'facts applied to context',
    keyFact:
      'About 2/3 of all transformer parameters live in FFN layers — they\'re the main knowledge store.',
    whyItMatters:
      'Attention figures out WHAT\'S relevant. FFN applies WHAT WE KNOW about those things. Together they reason.',
  },

  transformerBlock: {
    color: '#a78bfa',
    icon: '🧱',
    displayTitle: 'Transformer Block',
    tagline: 'One full round of "reading + thinking"',
    analogy:
      'Like reading a paragraph once and updating your understanding. Stack multiple blocks = read it multiple times, understanding more deeply each time.\n\nA full LLM is just many of these blocks stacked up.',
    inputLabel:  'Vectors from previous block',
    inputEx:     'hidden states',
    outputLabel: 'Refined vectors',
    outputEx:    'deeper understanding encoded',
    keyFact:
      'GPT-2 has 12 blocks. GPT-4 reportedly has ~96. Each block = one more "layer of thought".',
    whyItMatters:
      'Each block refines the representation — early blocks handle grammar and syntax, later blocks handle facts and reasoning.',
  },

  output: {
    color: '#10b981',
    icon: '🎯',
    displayTitle: 'Output / Predictor',
    tagline: 'Predicts which word should come next',
    analogy:
      'After all the reading and thinking, the model asks: "what word is most likely to come next?" It scores every single word in the vocabulary and returns probabilities.\n\n"cat": 34%, "dog": 18%, "bird": 8%...',
    inputLabel:  'Final hidden vector',
    inputEx:     'last token\'s representation',
    outputLabel: 'Probability for every word',
    outputEx:    '"cat" 34%, "dog" 18%, ...',
    keyFact:
      'Temperature controls creativity: low temp = picks most likely word, high temp = more surprising/creative.',
    whyItMatters:
      'The whole model is trained to make this one prediction well — maximise the probability of the correct next word across billions of examples.',
  },
};

// Ordered tour steps for guided walkthrough
export const TOUR_STEPS = [
  {
    nodeIdPrefix: 'tokenizer',
    title: 'Step 1 — Tokenizer',
    body: 'This is where everything starts. Your text is split into tokens (words or word-pieces) and each one is mapped to a number. The AI only ever sees these numbers.',
    tip: 'Try typing "hello world" — see how it becomes [id, id]',
  },
  {
    nodeIdPrefix: 'embedding',
    title: 'Step 2 — Embedding Layer',
    body: 'Each number is looked up in a giant table to get a "meaning vector" — a list of numbers that capture what the word means. Similar words get similar vectors.',
    tip: 'The heatmap shows each token\'s meaning vector. Each column is one dimension.',
  },
  {
    nodeIdPrefix: 'positional',
    title: 'Step 3 — Position Encoder',
    body: 'The model reads all words simultaneously — so we need to stamp each position with a unique pattern. Without this, word order wouldn\'t matter!',
    tip: 'Notice the sine-wave pattern in the PE heatmap — each row is a different position.',
  },
  {
    nodeIdPrefix: 'mha',
    title: 'Step 4 — Attention',
    body: 'This is the magic ingredient. Every word looks at every other word and scores how relevant they are. "The bank was steep" — attention figures out "bank" = river, not money.',
    tip: 'The attention map shows which words pay attention to which. Bright = strong connection.',
  },
  {
    nodeIdPrefix: 'ffn',
    title: 'Step 5 — Feed-Forward Network',
    body: 'After attention figures out context, the FFN applies stored knowledge. Researchers found this layer works like a key-value memory — it\'s where facts about the world live.',
    tip: 'This layer is where most of the model\'s "knowledge" is stored.',
  },
  {
    nodeIdPrefix: 'output',
    title: 'Step 6 — Output',
    body: 'Finally! The model scores every word in the vocabulary and outputs a probability for each. The highest probability word is the prediction for "what comes next".',
    tip: 'Try the Generate button — watch the model pick word after word!',
  },
];
