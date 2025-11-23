/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRight, Terminal, Cpu, Activity, Code } from 'lucide-react';

interface LandingPageProps {
  onGetAccess: () => void;
  isFading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetAccess, isFading }) => {
  const [accessGranted, setAccessGranted] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessGranted(true);
    setTimeout(onGetAccess, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-nexus-bg text-zinc-200">
      
      <div className="container mx-auto px-6 z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Content */}
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              STATUS: OPERATIONAL
           </div>
           
           <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-white font-sans">
             Reasoning Engine <br />
             <span className="text-zinc-500">for Developers</span>
           </h1>
           
           <p className="text-zinc-400 text-lg mb-8 max-w-lg leading-relaxed">
             A unified interface for Grok 4.1, Gemini 2.0 Flash, and InfiP. 
             Optimized for code generation, visual analysis, and creative synthesis.
           </p>

           <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-4 max-w-md">
             <button 
                type="submit"
                disabled={accessGranted}
                className={`group flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${accessGranted ? 'bg-zinc-800 text-white cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}
             >
                {accessGranted ? (
                    <>Initializing...</>
                ) : (
                    <>Enter Workspace <ArrowRight size={18} /></>
                )}
             </button>
           </form>

           <div className="mt-12 flex items-center gap-8 text-zinc-500 text-sm font-mono border-t border-zinc-900 pt-8">
              <div className="flex items-center gap-2">
                  <Cpu size={16} /> Multi-Model
              </div>
              <div className="flex items-center gap-2">
                  <Terminal size={16} /> Real-Time Web
              </div>
              <div className="flex items-center gap-2">
                  <Code size={16} /> Code Interpreter
              </div>
           </div>
        </div>

        {/* Right: Clean IDE Representation */}
        <div className="hidden lg:block">
            <div className="bg-[#1e1e1e] rounded-lg border border-zinc-800 shadow-2xl overflow-hidden font-mono text-sm">
                 <div className="flex items-center gap-2 px-4 py-3 bg-[#252526] border-b border-zinc-800">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                    <span className="ml-4 text-zinc-400 text-xs">main.tsx — Nexus</span>
                 </div>
                 
                 <div className="p-6 text-zinc-300 space-y-2">
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">1</span>
                        <span><span className="text-purple-400">const</span> <span className="text-blue-400">Nexus</span> = <span className="text-yellow-300">async</span> (query) <span className="text-purple-400">=&gt;</span> {'{'}</span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">2</span>
                        <span className="pl-4"><span className="text-zinc-500">// Route to optimal model</span></span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">3</span>
                        <span className="pl-4"><span className="text-purple-400">const</span> model = <span className="text-yellow-300">detectIntent</span>(query);</span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">4</span>
                        <span className="pl-4"><span className="text-purple-400">return</span> <span className="text-purple-400">await</span> model.<span className="text-yellow-300">generate</span>({'{'}</span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">5</span>
                        <span className="pl-8"><span className="text-blue-300">context</span>: <span className="text-orange-300">"real-time"</span>,</span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">6</span>
                        <span className="pl-8"><span className="text-blue-300">reasoning</span>: <span className="text-blue-400">true</span></span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">7</span>
                        <span className="pl-4">{'}'});</span>
                    </div>
                    <div className="flex">
                        <span className="text-zinc-600 select-none mr-4">8</span>
                        <span>{'}'};</span>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};