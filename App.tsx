import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DrillSession from './components/DrillSession';
import Analysis from './components/Analysis';
import { User, AppView, QuestionType, DrillResult } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [currentTopic, setCurrentTopic] = useState<QuestionType | null>(null);
  const [lastResult, setLastResult] = useState<DrillResult | null>(null);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  const handleStartDrill = (topic: QuestionType) => {
    setCurrentTopic(topic);
    setView('drill');
  };

  const handleDrillComplete = (result: DrillResult) => {
    if (user) {
      const updatedUser = {
        ...user,
        history: [...user.history, result]
      };
      setUser(updatedUser);
    }
    setLastResult(result);
    setView('analysis');
  };

  const handleDrillCancel = () => {
    setView('dashboard');
    setCurrentTopic(null);
  };

  const handleRetry = () => {
    if (currentTopic) {
      setView('drill');
    } else {
      setView('dashboard');
    }
  };

  const handleHome = () => {
    setView('dashboard');
    setCurrentTopic(null);
    setLastResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-brand-500/30">
      {view === 'login' && <Login onLogin={handleLogin} />}
      
      {view === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onStartDrill={handleStartDrill} 
          onLogout={handleLogout} 
        />
      )}

      {view === 'drill' && currentTopic && (
        <DrillSession 
          topic={currentTopic}
          onComplete={handleDrillComplete}
          onCancel={handleDrillCancel}
        />
      )}

      {view === 'analysis' && lastResult && (
        <Analysis 
          result={lastResult}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </div>
  );
};

export default App;