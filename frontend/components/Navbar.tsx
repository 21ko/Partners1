
import React, { useState } from 'react';
import { LogOut, User } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Feed' },
    { id: 'explore', label: 'Builders' },
    { id: 'matchmaker', label: 'AI Scout' },
    { id: 'hackathons', label: 'Hackathons' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-10 h-10 builder-gradient rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/20">
          P
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Partners</h1>
      </div>

      <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
          }}
          className={`w-10 h-10 rounded-full border-2 p-0.5 overflow-hidden transition-all ${activeTab === 'profile' ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-600'
            }`}
        >
          <img src="https://picsum.photos/seed/me/100" alt="Avatar" className="w-full h-full rounded-full object-cover" />
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-12 w-48 glass border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <User size={16} />
                <span className="text-sm font-medium">My Profile</span>
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-slate-800 transition-colors border-t border-slate-800"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
