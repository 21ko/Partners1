import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Builder } from '../types';

// Static community directory — real builders will come from /discover
const COMMUNITY_BUILDERS: Builder[] = [
  {
    username: 'marco_infra',
    github_username: 'marcorossi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marco',
    bio: 'Ex-Stripe engineer. Obsessed with infra that actually holds up at scale.',
    building_style: 'plans_first',
    interests: ['backend', 'infrastructure', 'fintech'],
    open_to: ['weekend projects', 'hackathons'],
    availability: 'this_weekend',
    github_languages: ['Go', 'Node.js', 'PostgreSQL'],
    github_repos: [],
    total_stars: 210,
    public_repos: 12,
    city: 'Milan',
    learning: ['Rust', 'Wasm'],
    experience_level: 'advanced',
    looking_for: 'build_partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    username: 'sarah_ux',
    github_username: 'sarahjin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    bio: 'Design system lover. Making software feel human, one component at a time.',
    building_style: 'designs_first',
    interests: ['design systems', 'mobile', 'web apps'],
    open_to: ['weekend projects', 'freelance'],
    availability: 'this_month',
    github_languages: ['TypeScript', 'React', 'Figma'],
    github_repos: [],
    total_stars: 89,
    public_repos: 24,
    city: 'Seoul',
    learning: ['Framer Motion', 'Three.js'],
    experience_level: 'intermediate',
    looking_for: 'build_partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const AVAILABILITY_LABELS: Record<string, string> = {
  this_weekend: '🟢 THIS_WEEKEND',
  this_month: '🟡 THIS_MONTH',
  open: '🔵 OPEN_FOR_COLLAB',
  busy: '🔴 BUSY_SHIPPING',
};

const Explore: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = (COMMUNITY_BUILDERS || []).filter((b) => {
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
              <img src={builder.avatar} className="w-12 h-12 rounded-lg border border-slate-800" alt="" />
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
    </div>
  );
};

export default Explore;
