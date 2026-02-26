import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';

const QUOTES = [
  "Build for the problem you have today, not the scale you might have in two years.",
  "The best way to predict the future is to ship it.",
  "Simple is better than complex. Complex is better than complicated.",
  "Done is better than perfect. Build, break, fix, repeat.",
  "Find a partner who challenges your logic, not just your layout.",
  "Real builders ship at 2 AM and debug over coffee."
];

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const user = authService.getSession()?.profile;
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    // Randomize initial quote
    setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
  };

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-terminal-green/20 to-terminal-blue/20">
        <div className="bg-[#0A0F1C] rounded-[calc(1.5rem-1px)] p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-terminal-green">PROTOCOL_ESTABLISHED</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight"
            >
              Welcome back, <br />
              <span className="text-terminal-green font-mono">@{user?.username || 'builder'}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed mb-8"
            >
              You're currently in <span className="text-white font-bold italic">discovery mode</span>.
              Find someone who matches your vibe and build something that matters.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => setActiveTab('matchmaker')}
                className="bg-terminal-green text-[#0A0F1C] font-mono font-black py-4 px-8 rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)]"
              >
                FIND_PARTNER.EXE
              </button>
              <button className="border border-slate-800 text-white font-mono py-4 px-8 rounded-xl hover:bg-slate-800 transition-all">
                VIEW_SESSION_LOGS
              </button>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-10 font-mono text-[180px] font-black pointer-events-none select-none">
            01
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-terminal-blue">&gt;</span> ACTIVE_HACKATHONS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'DeFi_Summer_Sprint', prize: '$10k', tag: 'SOLANA' },
                { title: 'Gemini_Intelligence_Jam', prize: '$50k', tag: 'AI/LLM' },
              ].map((h, i) => (
                <div key={i} className="group p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-terminal-blue transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono font-bold px-2 py-1 bg-terminal-blue/10 text-terminal-blue rounded border border-terminal-blue/20">
                      {h.tag}
                    </span>
                    <span className="text-xs text-terminal-green font-mono">{h.prize} pool</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">{h.title}</h4>
                  <p className="text-xs text-slate-500 mb-6">Sept 12-14 • Hybrid Event</p>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-terminal-blue group-hover:w-full transition-all duration-1000 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-terminal-purple">&gt;</span> SYSTEM_MESSAGES
            </h3>
            <div className="space-y-3">
              {[
                "Connection request from @bob-ml: 'Let's build that AI tool'",
                "New builder @sarah-ux just joined your city",
                "Successfully matched with @marco_infra for 'Infrastructure_Project'",
              ].map((msg, i) => (
                <div key={i} className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl text-xs font-mono text-slate-400 flex items-center gap-4 group hover:bg-slate-900/50 transition-colors">
                  <span className="text-terminal-green font-bold">[{new Date().toLocaleTimeString('en-GB')}]</span>
                  <span className="group-hover:text-white transition-colors">{msg}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* QUOTE OF THE DAY - PRESERVED & STYLED */}
          <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl text-terminal-green font-mono">"</span>
            </div>
            <h3 className="text-xs font-mono font-bold text-terminal-green uppercase tracking-widest mb-4">Daily_Inspiration</h3>
            <div className="min-h-[100px] flex flex-col justify-center">
              <p className="text-sm text-slate-300 italic font-medium leading-relaxed mb-6">
                "{QUOTES[quoteIdx]}"
              </p>
            </div>
            <button
              onClick={nextQuote}
              className="text-[10px] font-mono text-terminal-green border border-terminal-green/30 px-3 py-1.5 rounded-lg hover:bg-terminal-green/10 transition-all uppercase tracking-tighter"
            >
              Reload_Buffer
            </button>
          </section>

          <section className="p-1 bg-gradient-to-br from-terminal-purple/30 to-terminal-pink/30 rounded-2xl">
            <div className="bg-[#0A0F1C] p-6 rounded-[calc(1rem-1px)] h-full">
              <h3 className="text-xs font-mono font-bold text-terminal-purple uppercase tracking-widest mb-4">Network_Status</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Builders_Online</span>
                  <span className="text-xl font-bold text-terminal-purple font-mono">1,204</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Matches_Today</span>
                  <span className="text-xl font-bold text-terminal-purple font-mono">42</span>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 italic text-center">
                    "Find someone who codes like nobody's watching."
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
