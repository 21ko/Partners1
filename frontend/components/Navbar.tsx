import React from 'react';
import { motion } from 'framer-motion';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const TABS = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '01' },
    { id: 'explore', label: 'EXPLORE', icon: '02' },
    { id: 'matchmaker', label: 'DISCOVER', icon: '03' },
    { id: 'profile', label: 'PROFILE', icon: '04' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-slate-900 px-6 py-4">
      <div className="container mx-auto max-w-6xl flex justify-between items-center">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-8 h-8 border border-terminal-green flex items-center justify-center rounded-lg group-hover:bg-terminal-green transition-all">
            <span className="text-terminal-green font-mono font-black group-hover:text-[#0A0F1C] text-sm italic">P</span>
          </div>
          <span className="font-mono font-black text-white text-xs tracking-[0.2em] hidden sm:block">PARTNERS_v1.0</span>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 text-[10px] font-mono font-black rounded-lg transition-all ${activeTab === tab.id ? 'text-terminal-green' : 'text-slate-500 hover:text-white'
                }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="nav"
                  className="absolute inset-0 bg-terminal-green/10 rounded-lg border-b border-terminal-green/30"
                />
              )}
              <span className="relative z-10 flex gap-2">
                <span className="opacity-30">{tab.icon}</span> {tab.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="text-[10px] font-mono text-slate-500 hover:text-red-500 transition-colors uppercase font-bold"
        >
          [LOGOUT]
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
