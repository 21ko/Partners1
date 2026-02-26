import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Builder, MatchResult } from '../types';
import { authService, API_URL, safeJson } from '../services/authService';

const AVAILABILITY_LABELS: Record<string, string> = {
  this_weekend: '🟢 THIS_WEEKEND',
  this_month: '🟡 THIS_MONTH',
  open: '🔵 OPEN_FOR_COLLAB',
  busy: '🔴 BUSY_SHIPPING',
};

const STYLE_LABELS: Record<string, string> = {
  ships_fast: '⚡ SHIPS_FAST',
  plans_first: '📐 PLANS_FIRST',
  designs_first: '🎨 DESIGNS_FIRST',
  figures_it_out: '🎲 FIGURES_IT_OUT',
};

const Discover: React.FC = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInterest, setFilterInterest] = useState('');
  const [matchLoading, setMatchLoading] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);

  const session = authService.getSession();

  const fetchBuilders = async (interest?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (session?.session_id) params.set('session_id', session.session_id);
      if (interest) params.set('filter_interest', interest);

      const res = await fetch(`${API_URL}/discover?${params.toString()}`);
      const data = await safeJson(res);
      setBuilders(data);
    } catch (e) {
      console.error('Failed to fetch builders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  const handleMatch = async (target: Builder) => {
    if (!session?.session_id) return;
    setMatchLoading(target.username);
    setMatchResult(null);
    setSelectedBuilder(target);

    try {
      const res = await fetch(`${API_URL}/match/${target.username}?session_id=${session.session_id}`, {
        method: 'POST',
      });
      const data = await safeJson(res);
      setMatchResult(data);
    } catch (e) {
      console.error('Match failed', e);
    } finally {
      setMatchLoading(null);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBuilders(filterInterest || undefined);
  };

  return (
    <div className="space-y-12">
      {/* Filter Section */}
      <section>
        <form onSubmit={handleFilter} className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filterInterest}
              onChange={(e) => setFilterInterest(e.target.value)}
              placeholder="FILTER_BY_INTEREST (E.G. AI_TOOLS, REACT, WEB3...)"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-4 text-terminal-blue placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-terminal-blue transition-all font-mono text-xs uppercase"
            />
          </div>
          <button
            type="submit"
            className="bg-terminal-blue text-[#0A0F1C] font-mono font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all text-xs"
          >
            RUN_FILTER
          </button>
        </form>
      </section>

      {/* Match Result Overlay/Panel */}
      <AnimatePresence>
        {matchResult && selectedBuilder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="p-8 bg-slate-900 border-2 border-terminal-green/30 rounded-3xl shadow-[0_0_50px_rgba(0,255,65,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6">
              <button onClick={() => setMatchResult(null)} className="text-slate-500 hover:text-white transition-colors">
                <span className="font-mono text-xs">[ESC] CLOSE</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-3 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img
                    src={selectedBuilder.avatar}
                    alt={selectedBuilder.username}
                    className="w-24 h-24 rounded-full border-4 border-terminal-green p-1"
                  />
                  <div className="absolute bottom-0 right-0 bg-terminal-green text-[#0A0F1C] text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
                    SELECTED
                  </div>
                </div>
                <h3 className="text-white font-black text-xl mb-1">@{selectedBuilder.username}</h3>
                <p className="text-terminal-green font-mono text-xs uppercase tracking-tighter">{matchResult.vibe}</p>
              </div>

              <div className="md:col-span-9 space-y-6">
                <div className="flex items-end gap-6 mb-2">
                  <div className="flex-grow">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">
                      <span>Chemistry_Analysis</span>
                      <span>{matchResult.chemistry_score}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchResult.chemistry_score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-terminal-green to-terminal-blue rounded-full"
                      />
                    </div>
                  </div>
                  <div className="text-6xl font-black text-terminal-green font-mono opacity-20">
                    {matchResult.chemistry_score}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-300 leading-relaxed text-sm">
                    <span className="text-terminal-green font-mono mr-2">&gt;</span>
                    {matchResult.why}
                  </p>
                  <div className="p-4 bg-terminal-green/5 border border-terminal-green/20 rounded-xl">
                    <h4 className="text-[10px] font-mono font-black text-terminal-green uppercase tracking-[0.2em] mb-2">Build_Proposal</h4>
                    <p className="text-white text-sm font-medium italic">"{matchResult.build_idea}"</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Builders Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : builders.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No_Builders_Detected_In_Sector</p>
            <button
              onClick={() => fetchBuilders()}
              className="mt-6 text-terminal-blue font-mono text-[10px] hover:underline"
            >
              REFRESH_SCAN_BUFFER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builders.map((builder, i) => (
              <BuilderCard
                key={builder.username}
                builder={builder}
                onMatch={handleMatch}
                matchLoading={matchLoading === builder.username}
                delay={i * 0.05}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface BuilderCardProps {
  builder: Builder;
  onMatch: (b: Builder) => void;
  matchLoading: boolean;
  delay: number;
}

const BuilderCard: React.FC<BuilderCardProps> = ({ builder, onMatch, matchLoading, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="group bg-[#0D1525] border border-slate-800 hover:border-terminal-blue/50 rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 relative overflow-hidden"
  >
    {/* Glow effect on hover */}
    <div className="absolute inset-0 bg-terminal-blue/0 group-hover:bg-terminal-blue/[0.02] transition-colors pointer-events-none" />

    <div className="flex items-start gap-4 z-10">
      <div className="relative">
        <img
          src={builder.avatar}
          alt={builder.username}
          className="w-16 h-16 rounded-xl border-2 border-slate-800 group-hover:border-terminal-blue transition-colors flex-shrink-0 grayscale group-hover:grayscale-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${builder.username}`;
          }}
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-terminal-green rounded-full border-2 border-[#0D1525] shadow-[0_0_8px_rgba(0,255,65,0.5)]" />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-white group-hover:text-terminal-blue transition-colors truncate">@{builder.username}</h3>
        <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-tighter">Loc: {builder.city || 'EARTH_SECTOR'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">
            {STYLE_LABELS[builder.building_style] || builder.building_style}
          </span>
        </div>
      </div>
    </div>

    <div className="space-y-4 z-10 flex-grow">
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 font-medium">
        {builder.bio}
      </p>

      {(builder.github_languages || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/50">
          {(builder.github_languages || []).slice(0, 3).map((lang) => (
            <span key={lang} className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-terminal-blue/5 text-terminal-blue border border-terminal-blue/10 rounded">
              {lang}
            </span>
          ))}
          {builder.github_languages.length > 3 && (
            <span className="text-[9px] font-mono text-slate-600">+{builder.github_languages.length - 3}</span>
          )}
        </div>
      )}
    </div>

    <div className="space-y-4 z-10">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
        <div className="flex gap-4">
          <span>⭐ {builder.total_stars}</span>
          <span>📦 {builder.public_repos}</span>
        </div>
        <span className="text-terminal-green">{AVAILABILITY_LABELS[builder.availability] || builder.availability}</span>
      </div>

      <button
        onClick={() => onMatch(builder)}
        disabled={matchLoading}
        className="w-full bg-[#0A0F1C] border border-terminal-blue/30 text-terminal-blue group-hover:bg-terminal-blue group-hover:text-[#0A0F1C] text-xs font-mono font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 uppercase tracking-widest overflow-hidden relative"
      >
        <span className="relative z-10">
          {matchLoading ? 'RUNNING_ANALYSIS...' : 'CHECK_CHEMISTRY'}
        </span>
        {matchLoading && (
          <motion.div
            layoutId="loading"
            className="absolute inset-0 bg-terminal-blue/20"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </button>
    </div>
  </motion.div>
);

export default Discover;
