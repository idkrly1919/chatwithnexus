/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ChatView } from './components/ChatView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'chat'>('landing');

  const handleGetAccess = () => {
      setCurrentView('chat');
  };

  return (
    <div className="min-h-screen bg-nexus-bg text-white relative">
        {currentView === 'landing' ? (
            <LandingPage onGetAccess={handleGetAccess} isFading={false} />
        ) : (
            <div className="h-full">
                <ChatView />
            </div>
        )}
    </div>
  );
};

export default App;