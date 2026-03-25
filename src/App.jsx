import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes }                from './config/nodeTypes.js';
import { initialNodes, initialEdges } from './config/initialGraph.js';
import Sidebar                      from './components/Sidebar.jsx';
import DetailPanel                  from './components/DetailPanel.jsx';
import GenerationPanel              from './components/GenerationPanel.jsx';
import ArchModal                    from './components/ArchModal.jsx';
import OnboardingOverlay            from './components/OnboardingOverlay.jsx';
import useTransformerStore          from './store/useTransformerStore.js';

let nodeIdCounter = 100;

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper  = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  const {
    inputText, setInputText,
    run, isRunning, hasRun, isGenerating,
    generate, stopGeneration,
    modelConfig, paramCount,
    showArchModal, setShowArchModal,
    showGenPanel, setShowGenPanel,
    generatedTokens,
  } = useTransformerStore();

  // ── Edges ──────────────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, style: { stroke: '#334155', strokeWidth: 2 } }, eds)
      ),
    [setEdges]
  );

  // Animate edges while running or generating
  const displayEdges = edges.map(e => ({
    ...e,
    animated: isRunning || isGenerating,
    style: {
      ...e.style,
      stroke: isRunning || isGenerating ? '#6366f1' : '#334155',
      strokeWidth: isRunning || isGenerating ? 2.5 : 2,
    },
  }));

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const payload = e.dataTransfer.getData('application/reactflow');
      if (!payload) return;
      const { type, data } = JSON.parse(payload);
      if (!type) return;
      const position = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes((nds) => nds.concat({ id: `${type}-${++nodeIdCounter}`, type, position, data: data ?? {} }));
    },
    [rfInstance, setNodes]
  );

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
  };

  // ── Param count display ────────────────────────────────────────────────────
  function fmtParams(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#020617',
        color: '#f1f5f9',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      {/* ── Top Toolbar ───────────────────────────────────────────────────── */}
      <header
        style={{
          height: 56,
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          background: '#0f172a',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
          <span style={{ fontSize: 22 }}>🧱</span>
          <span
            style={{
              fontWeight: 800, fontSize: 15,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            LLMBlock
          </span>
          <span style={{ fontSize: 10, color: '#334155', marginLeft: 2 }}>
            Transformer Studio
          </span>
        </div>

        <div style={{ width: 1, height: 32, background: '#1e293b', flexShrink: 0 }} />

        {/* Input */}
        <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>Input:</span>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type something… (Ctrl+Enter to run)"
          style={{
            flex: 1, maxWidth: 420,
            background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
            padding: '6px 10px', color: '#f1f5f9', fontSize: 13, outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {/* Run */}
        <button
          onClick={run}
          disabled={isRunning || isGenerating || !inputText.trim()}
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            cursor: (isRunning || isGenerating) ? 'wait' : 'pointer',
            background: (isRunning || isGenerating) ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: (isRunning || isGenerating) ? '#475569' : '#fff',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', minWidth: 72,
          }}
        >
          {isRunning ? '⚙ …' : '▶ Run'}
        </button>

        {/* Generate */}
        {!isGenerating ? (
          <button
            onClick={() => { setShowGenPanel(true); generate(); }}
            disabled={!inputText.trim()}
            style={{
              padding: '7px 14px', borderRadius: 6, border: '1px solid #7c3aed',
              cursor: 'pointer',
              background: showGenPanel ? '#7c3aed22' : 'none',
              color: '#a78bfa', fontWeight: 700, fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            🎲 Generate
          </button>
        ) : (
          <button
            onClick={stopGeneration}
            style={{
              padding: '7px 14px', borderRadius: 6, border: '1px solid #ef4444',
              cursor: 'pointer', background: '#ef444422',
              color: '#f87171', fontWeight: 700, fontSize: 12,
            }}
          >
            ⏹ Stop
          </button>
        )}

        <div style={{ width: 1, height: 32, background: '#1e293b', flexShrink: 0 }} />

        {/* Architecture button */}
        <button
          onClick={() => setShowArchModal(true)}
          style={{
            padding: '6px 12px', borderRadius: 6,
            border: '1px solid #334155', background: 'none',
            color: '#94a3b8', cursor: 'pointer', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span>⚙️</span>
          <span style={{ fontSize: 10 }}>
            {modelConfig.d_model}d · {modelConfig.n_heads}h · {modelConfig.n_layers}L
          </span>
        </button>

        {/* Param count */}
        <div
          style={{
            padding: '4px 10px', background: '#1e293b', borderRadius: 6,
            fontSize: 10, color: '#475569', whiteSpace: 'nowrap',
          }}
        >
          {fmtParams(paramCount)} params
        </div>
      </header>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <Sidebar />

        {/* Canvas */}
        <div
          ref={reactFlowWrapper}
          style={{
            flex: 1,
            position: 'relative',
            paddingBottom: showGenPanel ? 140 : 0,
            transition: 'padding-bottom 0.2s',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#020617' }}
          >
            <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />
            <Controls
              style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
            />
            <MiniMap
              style={{ background: '#0f172a', border: '1px solid #1e293b' }}
              nodeColor="#334155"
              maskColor="rgba(2,6,23,0.7)"
            />

            {/* Status banner */}
            {hasRun && !isRunning && !isGenerating && (
              <Panel position="top-right">
                <div
                  style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#64748b',
                  }}
                >
                  ✅ Done — click nodes to inspect · use tabs for Logit Lens & Embedding Space
                </div>
              </Panel>
            )}
            {(isRunning || isGenerating) && (
              <Panel position="top-right">
                <div
                  style={{
                    background: '#0f172a', border: '1px solid #6366f155',
                    borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#818cf8',
                  }}
                >
                  ⚙ {isGenerating ? `Generating… (${generatedTokens.length} tokens)` : 'Running pipeline…'}
                </div>
              </Panel>
            )}

            {!hasRun && (
              <Panel position="bottom-center">
                <div
                  style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 10, padding: '12px 20px', fontSize: 12,
                    color: '#64748b', textAlign: 'center', lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 3 }}>
                    👋 New? Click <strong style={{ color: '#818cf8' }}>🎓 Guided Tour</strong> in the sidebar
                  </div>
                  Or type something above and hit <strong style={{ color: '#3b82f6' }}>▶ Run</strong> to watch data flow through the model.
                  Then click any block to see what it does.
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right detail/tabs panel */}
        <DetailPanel />
      </div>

      {/* Generation panel — slides up from bottom */}
      <GenerationPanel />

      {/* Architecture modal */}
      <ArchModal />

      {/* Onboarding overlay (welcome + guided tour) */}
      <OnboardingOverlay />
    </div>
  );
}
