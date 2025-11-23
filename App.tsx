/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ChatView } from './components/ChatView';
import { BackgroundAmbience } from './components/BackgroundAmbience';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'chat'>('landing');
  const [isFading, setIsFading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMode, setTypingMode] = useState<'reasoning' | 'image-gen'>('reasoning');

  const handleGetAccess = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentView('chat');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden">
      {/* Background Ambience */}
      <BackgroundAmbience isTyping={isTyping} />
      
      {/* View Content */}
      <div className={`transition-opacity duration-500 ${isFading && currentView === 'landing' ? 'opacity-0' : 'opacity-100'}`}>
        {currentView === 'landing' && <LandingPage onGetAccess={handleGetAccess} />}
      </div>
      
      {currentView === 'chat' && (
        <div className="h-full">
            <ChatView 
              isTyping={isTyping} 
              setIsTyping={setIsTyping}
              typingMode={typingMode}
              setTypingMode={setTypingMode}
            />
        </div>
      )}
    </div>
  );
};

export default App;