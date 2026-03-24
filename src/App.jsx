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

import { nodeTypes } from './config/nodeTypes.js';
import { initialNodes, initialEdges } from './config/initialGraph.js';
import Sidebar from './components/Sidebar.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import useTransformerStore from './store/useTransformerStore.js';
import { MODEL_CONFIG } from './lib/weights.js';

let nodeIdCounter = 100;

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const {
    inputText, setInputText, run, isRunning, hasRun, selectedNodeId,
  } = useTransformerStore();

  // ── Edge connection ────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, style: { stroke: '#334155', strokeWidth: 2 } }, eds)
      ),
    [setEdges]
  );

  // ── Drag & drop from sidebar ──────────────────────────────────────────────
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const payload = event.dataTransfer.getData('application/reactflow');
      if (!payload) return;

      const { type, data } = JSON.parse(payload);
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${++nodeIdCounter}`,
        type,
        position,
        data: data ?? {},
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
  };

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
          padding: '0 16px',
          gap: 12,
          background: '#0f172a',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <span style={{ fontSize: 22 }}>🧱</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 15,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            LLMBlock
          </span>
          <span style={{ fontSize: 10, color: '#475569', marginLeft: 2 }}>
            LEGO Transformer Studio
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 32, background: '#1e293b' }} />

        {/* Input text */}
        <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
            Input:
          </span>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type something… (Enter to run)"
            style={{
              flex: 1,
              maxWidth: 460,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#f1f5f9',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Run button */}
        <button
          onClick={run}
          disabled={isRunning || !inputText.trim()}
          style={{
            padding: '7px 20px',
            borderRadius: 6,
            border: 'none',
            cursor: isRunning ? 'wait' : 'pointer',
            background: isRunning ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: isRunning ? '#64748b' : '#fff',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
            minWidth: 80,
          }}
        >
          {isRunning ? '⚙ Running…' : '▶ Run'}
        </button>

        {/* Model info badge */}
        <div
          style={{
            padding: '4px 10px',
            background: '#1e293b',
            borderRadius: 6,
            fontSize: 10,
            color: '#64748b',
            whiteSpace: 'nowrap',
          }}
        >
          d_model={MODEL_CONFIG.d_model} · {MODEL_CONFIG.n_heads} heads · {MODEL_CONFIG.n_layers} layers
        </div>
      </header>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />

        {/* Canvas */}
        <div ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#020617' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#1e293b"
              gap={20}
              size={1}
            />
            <Controls
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 8,
              }}
            />
            <MiniMap
              style={{ background: '#0f172a', border: '1px solid #1e293b' }}
              nodeColor="#334155"
              maskColor="rgba(2,6,23,0.7)"
            />

            {/* Status panel */}
            {hasRun && (
              <Panel position="top-right">
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11,
                    color: '#94a3b8',
                  }}
                >
                  ✅ Pipeline complete — click any node to inspect
                </div>
              </Panel>
            )}

            {!hasRun && (
              <Panel position="bottom-center">
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 12,
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  Enter text above and click{' '}
                  <strong style={{ color: '#3b82f6' }}>▶ Run</strong> to see the
                  transformer process your input through each block
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Detail inspector panel */}
        <DetailPanel />
      </div>
    </div>
  );
}
