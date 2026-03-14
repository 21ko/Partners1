import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Builder } from '../types';
import { authService, API_URL, safeJson } from '../services/authService';

const AVAILABILITY_LABELS: Record<string, string> = {
  this_weekend: '🟢 THIS_WEEKEND',
  this_month: '🟡 THIS_MONTH',
  open: '🔵 OPEN_FOR_COLLAB',
  busy: '🔴 BUSY_SHIPPING',
};

const Explore: React.FC = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBuilders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/discover`);
        const data = await safeJson(res);
        setBuilders(data);
      } catch (e) {
        console.error('Failed to fetch builders', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBuilders();
  }, []);

  const filtered = (builders || []).filter((b) => {
    const s = (search || '').toLowerCase();
    const username = (b.username || '').toLowerCase();
    const bio = (b.bio || '').toLowerCase();
    const langs = (b.github_languages || []).map(l => l.toLowerCase());

    return username.includes(s) ||
      bio.includes(s) ||
      langs.some(l => l.includes(s));
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">COMMUNITY_DIRECTORY</h2>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Global_Index_Of_Verified_Builders</p>
        </div>
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="SEARCH_BY_QUERY..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-3 text-terminal-green font-mono text-xs focus:ring-1 focus:ring-terminal-green outline-none"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No_Builders_Detected_In_Sector</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((builder, i) => (
            <motion.div
              key={builder.username || i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <img 
                  src={builder.avatar} 
                  className="w-12 h-12 rounded-lg border border-slate-800" 
                  alt="" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${builder.username}`;
                  }}
                />
                <div>
                  <div className="font-bold text-white text-sm">@{builder.username || 'builder'}</div>
                  <div className="text-[9px] font-mono text-terminal-green">{AVAILABILITY_LABELS[builder.availability] || 'OPEN'}</div>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">"{builder.bio || ''}"</p>
              <div className="flex flex-wrap gap-1">
                {(builder.github_languages || []).slice(0, 3).map(l => (
                  <span key={l} className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">{l}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
