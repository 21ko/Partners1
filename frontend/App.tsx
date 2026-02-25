import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Matchmaker from './pages/Matchmaker';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import { Builder } from './types';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Builder | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      setIsAuthenticated(true);
      setUser(session.profile);
    }
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = () => {
    const session = authService.getSession();
    if (session) {
      setIsAuthenticated(true);
      setUser(session.profile);
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    authService.clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleUserUpdate = (updated: Builder) => {
    setUser(updated);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1C] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 border-2 border-terminal-green rounded-xl flex items-center justify-center mb-8 relative"
        >
          <span className="text-4xl font-bold text-terminal-green font-mono">P</span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-4px] border border-terminal-green/30 rounded-xl"
          />
        </motion.div>
        <div className="text-terminal-green font-mono text-sm tracking-widest animate-pulse">
          INITIALIZING_PARTNERS_PROTOCOL...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </motion.div>
    );
  }

  const renderContent = () => {
    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {(() => {
          switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'explore': return <Explore />;
            case 'matchmaker': return <Matchmaker />;
            case 'profile': return user ? <Profile user={user} onUpdate={handleUserUpdate} /> : <Dashboard />;
            default: return <Dashboard />;
          }
        })()}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-terminal-green/30 selection:text-terminal-green">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-slate-900 bg-[#0A0F1C]">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center gap-8 mb-6 font-mono text-[10px] text-slate-500">
            <span className="hover:text-terminal-green cursor-pointer transition-colors">v1.0.0-PROD</span>
            <span className="hover:text-terminal-green cursor-pointer transition-colors">UPTIME: 99.9%</span>
            <span className="hover:text-terminal-green cursor-pointer transition-colors">LATENCY: 24ms</span>
          </div>
          <p className="text-slate-600 text-xs font-mono">
            &gt; PARTNERS_PROJECT // BUILT_BY_YAHYA // 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
