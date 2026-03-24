/**
 * Simple word-level tokenizer with a ~256-token vocabulary.
 * Provides token → id and id → token lookups.
 */

const WORDS = [
  // special
  '<PAD>', '<BOS>', '<EOS>', '<UNK>',
  // articles & prepositions
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'into', 'about', 'through', 'between', 'after', 'before', 'during', 'above',
  // conjunctions & misc
  'and', 'or', 'but', 'if', 'then', 'so', 'yet', 'nor', 'both', 'either',
  'neither', 'not', 'also', 'just', 'even', 'only', 'too', 'very', 'much',
  // verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can', 'go', 'get', 'make', 'know', 'think', 'see', 'come',
  'want', 'look', 'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask',
  'need', 'feel', 'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin',
  'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring',
  'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'set',
  // pronouns & determiners
  'I', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
  'which', 'who', 'what', 'when', 'where', 'why', 'how', 'each', 'every', 'some',
  'any', 'all', 'both', 'few', 'more', 'most', 'other', 'such', 'same', 'own',
  // adjectives
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'right',
  'big', 'high', 'small', 'large', 'next', 'early', 'young', 'old', 'important',
  'different', 'real', 'best', 'free', 'able', 'full', 'true', 'hard', 'strong',
  'deep', 'clear', 'open', 'easy', 'possible', 'human', 'public', 'late', 'far',
  'local', 'major', 'social', 'global', 'natural', 'simple', 'complex', 'current',
  // nouns
  'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'world',
  'life', 'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'question',
  'program', 'government', 'number', 'night', 'point', 'home', 'water', 'room',
  'mother', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study',
  'book', 'eye', 'job', 'word', 'business', 'issue', 'side', 'kind', 'head',
  'house', 'service', 'friend', 'father', 'power', 'hour', 'game', 'line', 'end',
  'data', 'model', 'layer', 'network', 'input', 'output', 'vector', 'matrix',
  'token', 'word', 'text', 'language', 'machine', 'learning', 'neural', 'weight',
  'attention', 'transformer', 'head', 'embedding', 'encoder', 'decoder', 'query',
  'key', 'value', 'context', 'sequence', 'position', 'dimension', 'probability',
  // adverbs
  'up', 'back', 'out', 'down', 'still', 'never', 'always', 'often', 'well',
  'again', 'already', 'now', 'ever', 'away', 'here', 'there', 'then', 'around',
  // numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  // punctuation as tokens
  '.', ',', '!', '?', ':', ';', "'", '"', '-', '(',  ')',
];

// Build vocab maps
export const vocab = WORDS;
export const tokenToId = Object.fromEntries(WORDS.map((w, i) => [w.toLowerCase(), i]));
export const idToToken = Object.fromEntries(WORDS.map((w, i) => [i, w]));
export const VOCAB_SIZE = WORDS.length;
export const PAD_ID = 0;
export const BOS_ID = 1;
export const EOS_ID = 2;
export const UNK_ID = 3;

/**
 * Tokenize text into an array of {token, id, original} objects.
 * Splits on whitespace and punctuation boundaries.
 */
export function tokenize(text) {
  // Split on whitespace / punctuation
  const raw = text
    .trim()
    .replace(/([.,!?:;'"()\-])/g, ' $1 ')
    .split(/\s+/)
    .filter(Boolean);

  const result = [{ token: '<BOS>', id: BOS_ID, original: '' }];

  for (const word of raw) {
    const lower = word.toLowerCase();
    const id = tokenToId[lower] !== undefined ? tokenToId[lower] : UNK_ID;
    result.push({ token: lower, id, original: word });
  }

  result.push({ token: '<EOS>', id: EOS_ID, original: '' });

  return result;
}

/**
 * Decode token ids back to a string.
 */
export function decode(ids) {
  return ids
    .filter(id => id !== BOS_ID && id !== EOS_ID && id !== PAD_ID)
    .map(id => idToToken[id] ?? '<UNK>')
    .join(' ');
}

/** Return top-k most likely next tokens given a probability vector */
export function topK(probs, k = 10) {
  return probs
    .map((p, i) => ({ id: i, token: idToToken[i] ?? `[${i}]`, prob: p }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, k);
}
