
import React from 'react';
import { Builder } from '../types';

interface BuilderCardProps {
  builder: Builder;
  onSelect?: (builder: Builder) => void;
}

const BuilderCard: React.FC<BuilderCardProps> = ({ builder, onSelect }) => {
  return (
    <div className="glass p-5 rounded-2xl hover:border-indigo-500/50 transition-all group flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img src={builder.avatar} alt={builder.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
            builder.availability === 'Looking for Team' ? 'bg-green-500' : 'bg-slate-500'
          }`}></div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{builder.name}</h3>
          <p className="text-slate-400 text-sm font-medium">{builder.role}</p>
          <p className="text-slate-500 text-xs mt-1">📍 {builder.location}</p>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm line-clamp-2 mb-4 flex-grow italic">
        "{builder.bio}"
      </p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {builder.skills.map((skill) => (
          <span key={skill} className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {skill}
          </span>
        ))}
      </div>

      <button 
        onClick={() => onSelect?.(builder)}
        className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-sm font-bold transition-all border border-indigo-500/30"
      >
        Connect
      </button>
    </div>
  );
};

export default BuilderCard;
