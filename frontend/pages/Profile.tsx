import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Builder } from '../types';
import { authService } from '../services/authService';

interface ProfileProps {
  user: Builder;
  onUpdate: (updated: Builder) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<Builder>>({
    building_style: user?.building_style || 'figures_it_out',
    availability: user?.availability || 'open',
    current_idea: user?.current_idea || '',
    interests: user?.interests || [],
    experience_level: user?.experience_level || 'intermediate',
    learning: user?.learning || [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authService.updateProfile(formData);
      onUpdate(res.profile);
      alert('PROFILE_UPDATED');
    } catch (e) {
      console.error(e);
      alert('UPDATE_FAILED');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = formData.interests || [];
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter(i => i !== interest) });
    } else {
      setFormData({ ...formData, interests: [...current, interest] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row items-center gap-8 bg-slate-900 p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <span className="text-8xl font-black font-mono tracking-tighter uppercase">USER_PROFILE</span>
        </div>

        <img src={user.avatar} className="w-32 h-32 rounded-3xl border-4 border-terminal-green p-1 relative z-10" alt="" />

        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-3xl font-black text-white mb-1">@{user?.username || 'builder'}</h2>
          <p className="text-terminal-green font-mono text-sm mb-4 uppercase tracking-[0.2em]">{user?.github_username || 'anonymous'}.github</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-mono text-slate-500">
            <span>⭐ {user?.total_stars || 0} STARS</span>
            <span>📦 {user?.public_repos || 0} REPOS</span>
            <span>📅 JOINED {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Style selection */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-mono font-bold text-terminal-green uppercase mb-6 tracking-widest">Work_Style_Configuration</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'ships_fast', label: 'Ships fast', icon: '⚡' },
              { id: 'plans_first', label: 'Plans first', icon: '📐' },
              { id: 'designs_first', label: 'Designs first', icon: '🎨' },
              { id: 'figures_it_out', label: 'Figures it out', icon: '🎲' },
            ].map(style => (
              <button
                key={style.id}
                onClick={() => setFormData({ ...formData, building_style: style.id as any })}
                className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${formData.building_style === style.id
                  ? 'bg-terminal-green/10 border-terminal-green text-terminal-green'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 grayscale hover:grayscale-0'
                  }`}
              >
                <span className="text-2xl">{style.icon}</span>
                {style.label}
              </button>
            ))}
          </div>
        </section>

        {/* Availability selection */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-mono font-bold text-terminal-blue uppercase mb-6 tracking-widest">Network_Availability</h3>
          <div className="space-y-3">
            {[
              { id: 'this_weekend', label: '🟢 Free this weekend' },
              { id: 'this_month', label: '🟡 Free this month' },
              { id: 'open', label: '🔵 Open for collab' },
              { id: 'busy', label: '🔴 Busy shipping' },
            ].map(avail => (
              <button
                key={avail.id}
                onClick={() => setFormData({ ...formData, availability: avail.id as any })}
                className={`w-full p-4 rounded-xl border text-left text-sm font-bold transition-all ${formData.availability === avail.id
                  ? 'bg-terminal-blue/10 border-terminal-blue text-terminal-blue'
                  : 'bg-slate-800/50 border-slate-700 text-slate-500'
                  }`}
              >
                {avail.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xs font-mono font-bold text-terminal-purple uppercase mb-6 tracking-widest">Project_Intent</h3>
        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">CURRENT_OR_IDEAL_PROJECT</label>
        <textarea
          value={formData.current_idea}
          onChange={(e) => setFormData({ ...formData, current_idea: e.target.value })}
          placeholder="WHAT ARE YOU THINKING ABOUT BUILDING?"
          className="w-full bg-[#0A0F1C] border border-slate-800 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-terminal-purple outline-none min-h-[100px]"
        />
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-terminal-green text-[#0A0F1C] font-mono font-black py-4 px-12 rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)] disabled:opacity-50"
        >
          {isSaving ? 'UPLOADING...' : 'COMMIT_CHANGES.SH'}
        </button>
      </div>
    </div>
  );
};

export default Profile;
