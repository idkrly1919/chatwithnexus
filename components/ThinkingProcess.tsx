/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Grid, Sparkles } from 'lucide-react';

interface ThinkingProcessProps {
  mode: 'reasoning' | 'image-gen';
}

const REASONING_STEPS = [
    "Thinking...",
    "Searching...",
    "Reasoning...",
    "Formulating..."
];

const IMAGE_GEN_STEPS = [
    "Synthesizing...",
    "Rendering...",
    "Enhancing..."
];

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ mode }) => {
  const [step, setStep] = useState(0);
  const steps = mode === 'reasoning' ? REASONING_STEPS : IMAGE_GEN_STEPS;

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 animate-pulse">
      <div className="flex items-center justify-center w-5 h-5">
        {mode === 'reasoning' ? (
             <Loader2 size={16} className="text-zinc-400 animate-spin" />
        ) : (
             <Sparkles size={16} className="text-zinc-400" />
        )}
      </div>
      
      <span className="text-xs font-medium text-zinc-400">
          {steps[step]}
      </span>
    </div>
  );
};