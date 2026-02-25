import React from 'react';
import { motion } from 'framer-motion';
import { Builder } from '../types';

interface BuilderCardProps {
  builder: Builder;
  onMatch: (builder: Builder) => void;
  matchLoading: boolean;
}

const AVAILABILITY_LABELS: Record<string, string> = {
  this_weekend: '🟢 THIS_WEEKEND',
  this_month: '🟡 THIS_MONTH',
  open: '🔵 OPEN_FOR_COLLAB',
  busy: '🔴 BUSY_SHIPPING',
};

const BuilderCard: React.FC<BuilderCardProps> = ({ builder, onMatch, matchLoading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D1525] border border-slate-800 p-6 rounded-2xl flex flex-col gap-6"
    >
      <div className="flex items-center gap-4">
        <img src={builder.avatar} className="w-16 h-16 rounded-xl border border-slate-800" alt="" />
        <div>
          <div className="font-bold text-white">@{builder.username}</div>
          <div className="text-[9px] font-mono text-slate-500 uppercase">{builder.city || 'PARIS_SECTOR'}</div>
          <div className="mt-2 text-[10px] font-mono text-terminal-green">{AVAILABILITY_LABELS[builder.availability]}</div>
        </div>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">"{builder.bio}"</p>

      <div className="flex flex-wrap gap-1">
        {builder.github_languages.slice(0, 3).map(l => (
          <span key={l} className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">{l}</span>
        ))}
      </div>

      <button
        onClick={() => onMatch(builder)}
        disabled={matchLoading}
        className="w-full bg-terminal-blue text-[#0A0F1C] text-[10px] font-mono font-black py-3 rounded-xl hover:opacity-90 transition-all uppercase"
      >
        {matchLoading ? 'RUNNING_SCAN...' : 'ANALYZE_CHEMISTRY'}
      </button>
    </motion.div>
  );
};

export default BuilderCard;
