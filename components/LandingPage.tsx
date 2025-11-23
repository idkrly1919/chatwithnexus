/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetAccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetAccess }) => {
  const [accessGranted, setAccessGranted] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessGranted(true);
    setTimeout(onGetAccess, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative text-zinc-200 z-10">
      
      <div className="container mx-auto px-6 z-10 flex flex-col items-center text-center">
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight gradient-text">
          Compute at the speed of thought.
        </h1>
           
        <p className="text-zinc-400 text-lg mb-8 max-w-2xl leading-relaxed">
          Nexus is a high-performance computational companion for complex reasoning, logical deduction, and multimodal synthesis.
        </p>

        <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-4 max-w-md w-full justify-center">
          <button 
            type="submit"
            disabled={accessGranted}
            className={`group flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-300 w-full sm:w-auto ${accessGranted ? 'bg-green-600 text-white' : 'bg-white text-zinc-900 hover:bg-zinc-200'}`}
          >
            {accessGranted ? 'Access Granted' : 'Request Access'}
            {!accessGranted && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-24 w-full max-w-4xl">
           <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-black/20 border-b border-zinc-800">
                   <div className="flex gap-1.5">
                       <div className="w-3 h-3 rounded-full bg-red-500"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                       <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   </div>
                   <span className="ml-4 text-zinc-400 text-xs font-mono">/bin/nexus --init</span>
                </div>
                
                <div className="p-6 text-zinc-300 space-y-2 font-mono text-sm text-left">
                   <div><span className="text-cyan-400">$</span> nexus.init(<span className="text-purple-400">{'model: "grok-4.1-fast"'}</span>)</div>
                   <div><span className="text-green-400"> success </span><span className="text-zinc-500">Model loaded.</span></div>
                   <div className="flex">
                       <span className="text-cyan-400 mr-2">$</span>
                       <span className="text-zinc-100">nexus.query(<span className="text-purple-400">"What is the orbital velocity of a satellite at 300km?"</span>, {'{ search: true }'})</span>
                       <span className="w-2 h-4 bg-cyan-300 animate-pulse ml-1"></span>
                   </div>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};