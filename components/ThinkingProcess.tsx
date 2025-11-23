/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, Box } from 'lucide-react';

interface ThinkingProcessProps {
  mode: 'reasoning' | 'image-gen';
}

const REASONING_TEXT = "Accessing neural web...";
const IMAGE_GEN_TEXT = "Calculating geometry...";

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ mode }) => {
  const text = mode === 'reasoning' ? REASONING_TEXT : IMAGE_GEN_TEXT;

  return (
    <div className="flex items-center gap-3 text-zinc-400">
      {mode === 'reasoning' ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Box size={16} className="text-cyan-400" />
      )}
      <span className="text-sm">{text}</span>
    </div>
  );
};