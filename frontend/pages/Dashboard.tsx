import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authService, API_URL, safeJson } from '../services/authService';
import { Community, Builder } from '../types';

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
  user?: Builder;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, user }) => {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingComms, setLoadingComms] = useState(true);
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [commMembers, setCommMembers] = useState<Builder[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [totalBuilders, setTotalBuilders] = useState<number | null>(null);

  const session = authService.getSession();

  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * QUOTES.length));

    // Fetch only the user's joined communities
    const fetchComms = async () => {
      if (!session?.session_id) {
        setLoadingComms(false);
        return;
      }
      try {
        // Get all communities + filter to ones the user has joined
        const all = await authService.getCommunities();
        // Get user's joined community IDs from their profile
        const profile = session.profile;
        const userInterests = (profile?.interests || []).map((i: string) => i.toLowerCase());

        // Filter: show communities matching user's interests or that they explicitly joined
        // We also always show hackathon communities
        const userComms = all.filter((c: Community) =>
          c.type === 'hackathon' ||
          userInterests.some((interest: string) =>
            c.name.toLowerCase().includes(interest) ||
            interest.includes(c.name.toLowerCase())
          )
        );

        setCommunities(userComms.slice(0, 4)); // max 4 on dashboard
      } catch (e) {
        console.error("Failed to fetch communities", e);
      } finally {
        setLoadingComms(false);
      }
    };

    // Fetch real builder count from /health
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        const data = await safeJson(res);
        setTotalBuilders(data.total_builders);
      } catch (e) {
        // silently fail
      }
    };

    fetchComms();
    fetchHealth();
  }, []);

  const handleCommunityClick = async (comm: Community) => {
    setSelectedComm(comm);
    setLoadingMembers(true);
    setCommMembers([]);
    try {
      const data = await authService.getCommunityMembers(comm.id);
      setCommMembers(data.members || []);
    } catch (e) {
      console.error("Failed to fetch members", e);
    } finally {
      setLoadingMembers(false);
    }
  };

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
              <span className="text-terminal-green font-mono">@{user?.username || session?.profile?.username || 'builder'}</span>
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
              <button
                onClick={() => setActiveTab('profile')}
                className="border border-slate-800 text-white font-mono py-4 px-8 rounded-xl hover:bg-slate-800 transition-all"
              >
                EDIT_PROFILE.EXE
              </button>
            </motion.div>
          </div>
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-10 font-mono text-[180px] font-black pointer-events-none select-none">
            01
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">

          {/* MY COMMUNITIES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="text-terminal-blue">&gt;</span> MY_COMMUNITIES
              </h3>
              <button
                onClick={() => setActiveTab('explore')}
                className="text-[10px] font-mono text-terminal-blue border border-terminal-blue/30 px-3 py-1.5 rounded-lg hover:bg-terminal-blue/10 transition-all"
              >
                BROWSE_ALL →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingComms ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-40 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
                ))
              ) : communities.length === 0 ? (
                <div className="col-span-2 p-12 text-center border border-slate-800 border-dashed rounded-2xl space-y-3">
                  <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No_Communities_Joined_Yet</p>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="text-terminal-blue font-mono text-[10px] hover:underline"
                  >
                    Browse communities →
                  </button>
                </div>
              ) : (
                communities.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleCommunityClick(h)}
                    className="group p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-terminal-blue transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${h.type === 'hackathon'
                            ? 'bg-terminal-green/10 text-terminal-green border-terminal-green/20'
                            : 'bg-terminal-blue/10 text-terminal-blue border-terminal-blue/20'
                          }`}>
                          {h.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-terminal-green font-mono">{h.members_count || 0} active</span>
                      </div>
                      <h4 className="font-bold text-white mb-2">{h.name.replace(/ /g, '_')}</h4>
                      <p className="text-[10px] text-slate-500 mb-6 font-mono leading-tight h-8 line-clamp-2 uppercase">
                        {h.description}
                      </p>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-terminal-blue transition-all duration-1000"
                          style={{ width: `${Math.min(100, ((h.members_count || 0) / 50) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Community Overlay */}
          <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${selectedComm ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: selectedComm ? 1 : 0 }}
              onClick={() => setSelectedComm(null)}
              className="absolute inset-0 bg-[#060A14]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: selectedComm ? 1 : 0, scale: selectedComm ? 1 : 0.9, y: selectedComm ? 0 : 20 }}
              className="w-full max-w-2xl bg-[#0A0F1C] border border-slate-800 rounded-3xl overflow-hidden relative z-10 shadow-2xl"
            >
              {selectedComm && (
                <div className="flex flex-col h-[600px]">
                  <div className="p-8 border-b border-slate-800 bg-slate-900/30">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-mono font-black text-terminal-blue bg-terminal-blue/10 px-2 py-1 rounded border border-terminal-blue/20 mb-3 inline-block">
                          SECTOR_{selectedComm.type.toUpperCase()}
                        </span>
                        <h3 className="text-2xl font-black text-white">{selectedComm.name}</h3>
                      </div>
                      <button onClick={() => setSelectedComm(null)} className="text-slate-500 hover:text-white transition-colors">
                        <span className="font-mono text-xs">[CLOSE_X]</span>
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm italic">"{selectedComm.description}"</p>
                  </div>

                  <div className="flex-grow overflow-y-auto p-8 space-y-6 scrollbar-hide">
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Detected_Builders_In_Hub</h4>
                    {loadingMembers ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : commMembers.length === 0 ? (
                      <div className="py-20 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                        <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">HUD_EMPTY // BE_THE_FIRST_TO_JOIN</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {commMembers.map((member) => (
                          <div key={member.username} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-terminal-green transition-all">
                            <div className="flex items-center gap-4">
                              <img src={member.avatar} className="w-10 h-10 rounded-lg border border-slate-800" alt=""
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`; }}
                              />
                              <div>
                                <div className="text-white font-bold text-sm">@{member.username}</div>
                                <div className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">{member.bio || 'STAYING_LOW_PROFILE'}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveTab('explore')}
                              className="text-[10px] font-mono text-terminal-green border border-terminal-green/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-terminal-green/10"
                            >
                              VIEW_DATA
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-900/20 border-t border-slate-800 flex justify-center">
                    <button
                      onClick={() => setSelectedComm(null)}
                      className="text-[10px] font-mono text-slate-500 hover:text-terminal-blue transition-colors uppercase"
                    >
                      Return_To_Command_Center
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* SYSTEM MESSAGES */}
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
                  <span className="text-xl font-bold text-terminal-purple font-mono">
                    {totalBuilders !== null ? totalBuilders.toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">My_Communities</span>
                  <span className="text-xl font-bold text-terminal-purple font-mono">
                    {loadingComms ? '—' : communities.length}
                  </span>
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