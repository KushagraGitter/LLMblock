/**
 * Default pipeline: GPT-2 style 2-layer transformer.
 * Laid out left-to-right with 280px horizontal spacing.
 */

export const initialNodes = [
  {
    id: 'tokenizer-1',
    type: 'tokenizer',
    position: { x: 40, y: 220 },
    data: {},
  },
  {
    id: 'embedding-1',
    type: 'embedding',
    position: { x: 340, y: 200 },
    data: {},
  },
  {
    id: 'positional-1',
    type: 'positionalEncoding',
    position: { x: 640, y: 200 },
    data: {},
  },
  // Layer 1
  {
    id: 'mha-1',
    type: 'multiHeadAttention',
    position: { x: 980, y: 40 },
    data: { layerIdx: 0 },
  },
  {
    id: 'ffn-1',
    type: 'ffn',
    position: { x: 980, y: 360 },
    data: { layerIdx: 0 },
  },
  {
    id: 'transformerBlock-1',
    type: 'transformerBlock',
    position: { x: 1280, y: 160 },
    data: { layerIdx: 0 },
  },
  // Layer 2
  {
    id: 'mha-2',
    type: 'multiHeadAttention',
    position: { x: 1620, y: 40 },
    data: { layerIdx: 1 },
  },
  {
    id: 'ffn-2',
    type: 'ffn',
    position: { x: 1620, y: 360 },
    data: { layerIdx: 1 },
  },
  {
    id: 'transformerBlock-2',
    type: 'transformerBlock',
    position: { x: 1920, y: 160 },
    data: { layerIdx: 1 },
  },
  // Output
  {
    id: 'output-1',
    type: 'output',
    position: { x: 2240, y: 200 },
    data: {},
  },
];

const edgeStyle = {
  stroke: '#334155',
  strokeWidth: 2,
};

const animatedEdgeStyle = {
  stroke: '#3b82f6',
  strokeWidth: 2,
};

export const initialEdges = [
  { id: 'e1', source: 'tokenizer-1',      target: 'embedding-1',      style: edgeStyle, animated: false },
  { id: 'e2', source: 'embedding-1',      target: 'positional-1',     style: edgeStyle },
  { id: 'e3', source: 'positional-1',     target: 'mha-1',            style: edgeStyle },
  { id: 'e4', source: 'positional-1',     target: 'ffn-1',            style: edgeStyle },
  { id: 'e5', source: 'mha-1',            target: 'transformerBlock-1', style: edgeStyle },
  { id: 'e6', source: 'ffn-1',            target: 'transformerBlock-1', style: edgeStyle },
  { id: 'e7', source: 'transformerBlock-1', target: 'mha-2',          style: edgeStyle },
  { id: 'e8', source: 'transformerBlock-1', target: 'ffn-2',          style: edgeStyle },
  { id: 'e9', source: 'mha-2',            target: 'transformerBlock-2', style: edgeStyle },
  { id: 'e10', source: 'ffn-2',           target: 'transformerBlock-2', style: edgeStyle },
  { id: 'e11', source: 'transformerBlock-2', target: 'output-1',      style: edgeStyle },
];
