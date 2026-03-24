import TokenizerNode from '../nodes/TokenizerNode.jsx';
import EmbeddingNode from '../nodes/EmbeddingNode.jsx';
import PositionalEncodingNode from '../nodes/PositionalEncodingNode.jsx';
import MultiHeadAttentionNode from '../nodes/MultiHeadAttentionNode.jsx';
import FFNNode from '../nodes/FFNNode.jsx';
import TransformerBlockNode from '../nodes/TransformerBlockNode.jsx';
import OutputNode from '../nodes/OutputNode.jsx';

export const nodeTypes = {
  tokenizer:          TokenizerNode,
  embedding:          EmbeddingNode,
  positionalEncoding: PositionalEncodingNode,
  multiHeadAttention: MultiHeadAttentionNode,
  ffn:                FFNNode,
  transformerBlock:   TransformerBlockNode,
  output:             OutputNode,
};
