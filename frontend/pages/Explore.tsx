
import React, { useState } from 'react';
import { Builder } from '../types';
import BuilderCard from '../components/BuilderCard';

const ALL_BUILDERS: Builder[] = [
  { id: 'b1', name: 'Marco Rossi', avatar: 'https://picsum.photos/seed/marco/100', role: 'Fullstack Dev', skills: ['Node.js', 'PostgreSQL', 'Redis'], bio: 'Ex-stripe engineer. Passionate about infra.', projectsCount: 12, location: 'Milan, Italy', availability: 'Looking for Team', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b2', name: 'Sarah Jin', avatar: 'https://picsum.photos/seed/sarah/100', role: 'Product Designer', skills: ['Figma', 'UX Research'], bio: 'Design system lover. Building beauty.', projectsCount: 24, location: 'Seoul, KR', availability: 'Solo Building', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b3', name: 'Dave Wilson', avatar: 'https://picsum.photos/seed/dave/100', role: 'AI Engineer', skills: ['Python', 'PyTorch', 'LLMs'], bio: 'Theory to product in AI.', projectsCount: 5, location: 'Austin, TX', availability: 'Looking for Team', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b4', name: 'Elena Petrova', avatar: 'https://picsum.photos/seed/elena/100', role: 'Growth Lead', skills: ['SEO', 'Content', 'Analytics'], bio: 'Helping apps reach 1M+ users.', projectsCount: 9, location: 'Berlin, DE', availability: 'Just Browsing', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b5', name: 'Kenji Sato', avatar: 'https://picsum.photos/seed/kenji/100', role: 'Solidity Dev', skills: ['Solidity', 'Go', 'Hardhat'], bio: 'Building the future of DeFi.', projectsCount: 15, location: 'Tokyo, JP', availability: 'Looking for Team', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b6', name: 'Amara Okafor', avatar: 'https://picsum.photos/seed/amara/100', role: 'DevOps', skills: ['Kubernetes', 'AWS', 'Terraform'], bio: 'Stability at scale.', projectsCount: 11, location: 'Lagos, NG', availability: 'Solo Building', links: [], pastProjectsList: [], lookingFor: [] },
];

const Explore: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = ALL_BUILDERS.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.role.toLowerCase().includes(search.toLowerCase()) ||
      b.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'All' || b.availability === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by skill, name or role..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-11 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          {['All', 'Looking for Team', 'Solo Building', 'Just Browsing'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === status
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(builder => (
            <BuilderCard key={builder.id} builder={builder} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">No builders found matching your criteria.</p>
          <button
            onClick={() => { setSearch(''); setFilter('All'); }}
            className="mt-4 text-indigo-400 font-bold hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;
