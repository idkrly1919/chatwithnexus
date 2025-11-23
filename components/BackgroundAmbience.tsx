/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';

const NUM_LIGHTS = 7;
const LIGHT_COLORS = [
  'rgba(29, 78, 216, 0.12)', // blue
  'rgba(79, 70, 229, 0.12)', // indigo
  'rgba(147, 51, 234, 0.12)',// purple
  'rgba(29, 78, 216, 0.15)', // blue
  'rgba(30, 159, 210, 0.15)',// sky
  'rgba(79, 70, 229, 0.15)', // indigo
  'rgba(147, 51, 234, 0.12)',// purple
];

const lights = Array.from({ length: NUM_LIGHTS }).map((_, i) => ({
  id: i,
  initialX: Math.random() * 100,
  initialY: Math.random() * 100,
  size: 250 + Math.random() * 150,
  color: LIGHT_COLORS[i % LIGHT_COLORS.length],
}));

export const BackgroundAmbience: React.FC<{ isTyping: boolean }> = ({ isTyping }) => {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
      <motion.div
        className="relative w-full h-full"
        animate={{ rotate: isTyping ? 360 : 0 }}
        transition={{
          duration: isTyping ? 10 : 2,
          ease: 'linear',
          repeat: isTyping ? Infinity : 0,
        }}
      >
        {lights.map((light, i) => {
          const angle = (i / NUM_LIGHTS) * 2 * Math.PI;
          const radius = 30; // vmin

          const circleX = `calc(50vw - ${light.size / 2}px + ${radius * Math.cos(angle)}vmin)`;
          const circleY = `calc(50vh - ${light.size / 2}px + ${radius * Math.sin(angle)}vmin)`;

          const waveXInitial = `${light.initialX}vw`;
          const waveYInitial = `${light.initialY}vh`;

          return (
            <motion.div
              key={light.id}
              className="absolute rounded-full"
              style={{
                width: light.size,
                height: light.size,
                backgroundColor: light.color,
                filter: 'blur(100px)',
                x: waveXInitial,
                y: waveYInitial,
                transform: 'translate(-50%, -50%)',
              }}
              initial={false}
              animate={{
                x: isTyping ? circleX : waveXInitial,
                y: isTyping ? circleY : waveYInitial,
                scale: isTyping ? 0.8 : 1.2,
              }}
              transition={
                isTyping
                  ? { type: 'spring', stiffness: 40, damping: 10 }
                  : {
                      duration: 10 + Math.random() * 8,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      ease: 'easeInOut',
                      delay: i * 1,
                    }
              }
            />
          );
        })}
      </motion.div>
    </div>
  );
};
