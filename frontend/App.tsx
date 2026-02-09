
import React, { useState, useEffect } from 'react';
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
      // Create user object from session data
      setUser({
        id: session.username,
        name: session.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.username}`,
        role: 'Builder',
        skills: [],
        bio: session.bio,
        projectsCount: 0,
        location: 'Remote',
        availability: 'Looking for Team',
        links: [],
        pastProjectsList: [],
        lookingFor: []
      });
    }

    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Update localStorage when user bio changes
  useEffect(() => {
    if (user && isAuthenticated) {
      const session = authService.getSession();
      if (session && user.bio !== session.bio) {
        // Update bio in localStorage
        localStorage.setItem('bio', user.bio);
      }
    }
  }, [user, isAuthenticated]);

  const handleAuthSuccess = () => {
    const session = authService.getSession();
    if (session) {
      setIsAuthenticated(true);
      setUser({
        id: session.username,
        name: session.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.username}`,
        role: 'Builder',
        skills: [],
        bio: session.bio,
        projectsCount: 0,
        location: 'Remote',
        availability: 'Looking for Team',
        links: [],
        pastProjectsList: [],
        lookingFor: []
      });
    }
  };

  const handleLogout = () => {
    authService.clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 builder-gradient rounded-2xl flex items-center justify-center animate-pulse mb-6">
          <span className="text-3xl font-bold text-white">F</span>
        </div>
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; transform: translateX(-100%); }
            50% { width: 100%; transform: translateX(0); }
            100% { width: 0%; transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'explore':
        return <Explore />;
      case 'matchmaker':
        return <Matchmaker currentUser={user!} />;
      case 'profile':
        return <Profile user={user!} onUpdate={setUser} />;
      case 'hackathons':
        return (
          <div className="py-20 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Hackathons Hub</h2>
            <p className="text-slate-400">Discover and join global hacking events. Feature coming soon!</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-grow container mx-auto px-6 py-8">
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Partners Platform</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-white">
              {activeTab === 'dashboard' && `Welcome back, ${user?.name}`}
              {activeTab === 'explore' && 'Community Directory'}
              {activeTab === 'matchmaker' && 'AI Co-founder Scout'}
              {activeTab === 'hackathons' && 'Hackathon Hub'}
              {activeTab === 'profile' && 'My Builder Profile'}
            </h1>
          </div>
        </header>

        {renderContent()}
      </main>

      <footer className="py-12 border-t border-slate-900 bg-slate-950/50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center gap-8 mb-8">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Github</a>
          </div>
          <p className="text-slate-600 text-sm">
            © 2026 Partners. Built by builders, for builders.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
