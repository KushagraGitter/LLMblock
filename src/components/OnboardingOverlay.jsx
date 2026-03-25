import React, { useState } from 'react';
import useTransformerStore from '../store/useTransformerStore.js';
import { TOUR_STEPS } from '../data/blockExplanations.js';

/**
 * Two-phase onboarding:
 * 1. Welcome screen (first visit only, or reset from help button)
 * 2. Guided tour (step through TOUR_STEPS, highlighting nodes)
 */
export default function OnboardingOverlay() {
  const { showOnboarding, setShowOnboarding, setTourHighlightId } = useTransformerStore();
  const [phase, setPhase]   = useState('welcome'); // 'welcome' | 'tour'
  const [step, setStep]     = useState(0);

  if (!showOnboarding) return null;

  // ── Welcome screen ──────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(2,6,23,0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 20,
            padding: '40px 44px',
            maxWidth: 500,
            textAlign: 'center',
            boxShadow: '0 32px 80px #000000a0',
          }}
        >
          {/* Logo */}
          <div style={{ fontSize: 56, marginBottom: 12 }}>🧱</div>
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: 26,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome to LLMBlock
          </h1>
          <p
            style={{
              color: '#64748b', fontSize: 13, marginBottom: 6, lineHeight: 1.5,
            }}
          >
            The interactive studio for learning how{' '}
            <strong style={{ color: '#94a3b8' }}>ChatGPT</strong>,{' '}
            <strong style={{ color: '#94a3b8' }}>Claude</strong>, and{' '}
            <strong style={{ color: '#94a3b8' }}>GPT-4</strong> actually work.
          </p>
          <p
            style={{ color: '#475569', fontSize: 12, marginBottom: 28, lineHeight: 1.5 }}
          >
            No prior knowledge needed. Build a language model from blocks,
            watch data flow through it, and understand every step.
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              justifyContent: 'center', marginBottom: 32,
            }}
          >
            {[
              ['✂️', 'Tokenizer'],
              ['🗺️', 'Embeddings'],
              ['👁️', 'Attention'],
              ['🧠', 'Knowledge'],
              ['🎯', 'Prediction'],
            ].map(([icon, label]) => (
              <span
                key={label}
                style={{
                  background: '#1e293b', borderRadius: 20,
                  padding: '5px 12px', fontSize: 11, color: '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {icon} {label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => { setPhase('tour'); setStep(0); setTourHighlightId(TOUR_STEPS[0].nodeIdPrefix); }}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', letterSpacing: '0.02em',
              }}
            >
              🚀 Start Guided Tour
            </button>
            <button
              onClick={() => { setShowOnboarding(false); setTourHighlightId(null); }}
              style={{
                padding: '12px 20px', borderRadius: 10,
                border: '1px solid #334155', background: 'none',
                color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              }}
            >
              Explore on my own
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Guided tour ─────────────────────────────────────────────────────────────
  const current = TOUR_STEPS[step];
  const isLast  = step === TOUR_STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      setShowOnboarding(false);
      setTourHighlightId(null);
    } else {
      const next = step + 1;
      setStep(next);
      setTourHighlightId(TOUR_STEPS[next].nodeIdPrefix);
    }
  };

  const goPrev = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      setTourHighlightId(TOUR_STEPS[prev].nodeIdPrefix);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 16,
          padding: '18px 22px',
          maxWidth: 440,
          boxShadow: '0 16px 48px #000000a0',
          pointerEvents: 'all',
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? '#6366f1' : i < step ? '#334155' : '#1e293b',
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Step title */}
        <div
          style={{
            fontSize: 13, fontWeight: 800, color: '#818cf8',
            marginBottom: 6, letterSpacing: '0.02em',
          }}
        >
          {current.title}
        </div>

        {/* Body */}
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 8px' }}>
          {current.body}
        </p>

        {/* Tip */}
        <div
          style={{
            background: '#1e293b', borderRadius: 8,
            padding: '7px 10px', fontSize: 11, color: '#64748b',
            marginBottom: 14, lineHeight: 1.5,
          }}
        >
          💡 {current.tip}
        </div>

        {/* Yellow glow callout */}
        <div
          style={{
            fontSize: 10, color: '#fbbf24', marginBottom: 12, textAlign: 'center',
          }}
        >
          ↑ Look for the gold-highlighted block on the canvas
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => { setShowOnboarding(false); setTourHighlightId(null); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: 11,
            }}
          >
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={goPrev}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  border: '1px solid #334155', background: 'none',
                  color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={goNext}
              style={{
                padding: '7px 18px', borderRadius: 8, border: 'none',
                background: isLast
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              {isLast ? '🎉 Done!' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
