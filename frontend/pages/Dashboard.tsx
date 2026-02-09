
import React from 'react';
import { Project, Hackathon } from '../types';

const MOCK_PROJECTS: Project[] = [
  { id: '1', title: 'EcoTrack AI', description: 'Carbon footprint calculator using Gemini vision to scan receipts.', tags: ['React', 'Gemini', 'Tailwind'], ownerId: 'u1', stars: 45, image: 'https://picsum.photos/seed/eco/600/400' },
  { id: '2', title: 'DeFi Pulse', description: 'Real-time dashboard for cross-chain liquidity tracking.', tags: ['Solidity', 'Next.js', 'D3'], ownerId: 'u2', stars: 128, image: 'https://picsum.photos/seed/defi/600/400' },
];

const MOCK_HACKATHONS: Hackathon[] = [
  { id: 'h1', title: 'Global Build 2024', date: 'Oct 15 - 17', location: 'Online / San Francisco', description: 'The ultimate builder summit.', prize: '$50k Pool' },
  { id: 'h2', title: 'AI Innovate', date: 'Nov 2', location: 'London / Hybrid', description: 'Push the limits of LLMs.', prize: 'NVIDIA H100s' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feed */}
      <div className="lg:col-span-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_PROJECTS.map(project => (
              <div key={project.id} className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer border border-slate-800/50">
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover opacity-80" />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      ★ {project.stars}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Community Buzz</h2>
            <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">Live Updates</span>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass p-4 rounded-xl flex gap-4 items-center">
                <img src={`https://picsum.photos/seed/user${i}/100`} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-white">Alex Chen</span> just shipped <span className="text-indigo-400 font-medium">Forge Components</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-8">
        <section className="glass p-6 rounded-2xl border-l-4 border-indigo-500">
          <h2 className="text-lg font-bold text-white mb-4">Upcoming Hackathons</h2>
          <div className="space-y-4">
            {MOCK_HACKATHONS.map(h => (
              <div key={h.id} className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white text-sm">{h.title}</h3>
                  <span className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{h.prize}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{h.date} • {h.location}</p>
                <button className="text-[11px] text-white bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">Apply Now</button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
            Host an Event
          </button>
        </section>

        <section className="glass p-6 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-bold text-white">Daily Inspiration</h2>
          </div>
          <p className="text-sm text-slate-300 italic mb-4">
            "Build for the problem you have today, not the scale you might have in two years."
          </p>
          <div className="flex gap-2">
            <button className="text-xs text-indigo-400 font-bold border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10">Next Quote</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
