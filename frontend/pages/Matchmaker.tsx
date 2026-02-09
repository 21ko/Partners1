import React, { useState } from 'react';
import { Builder, IntegratedMatchResult } from '../types';
import { getMatchAnalysis, generateBio, updateBio } from '../services/geminiService';
import BuilderCard from '../components/BuilderCard';
import { BrainCircuit, Github, Sparkles, Loader2 } from 'lucide-react';

interface MatchmakerProps {
  currentUser: Builder;
}

const CANDIDATES: Builder[] = [
  { id: 'b1', name: 'Marco Rossi', avatar: 'https://picsum.photos/seed/marco/100', role: 'Fullstack Dev', skills: ['Node.js', 'PostgreSQL', 'Redis'], bio: 'Ex-stripe engineer. Passionate about infra and scalable APIs.', projectsCount: 12, location: 'Milan, Italy', availability: 'Looking for Team', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b2', name: 'Sarah Jin', avatar: 'https://picsum.photos/seed/sarah/100', role: 'Product Designer', skills: ['Figma', 'UX Research', 'Prototyping'], bio: 'Design system lover. Helping startups build beauty.', projectsCount: 24, location: 'Seoul, KR', availability: 'Solo Building', links: [], pastProjectsList: [], lookingFor: [] },
  { id: 'b3', name: 'Dave Wilson', avatar: 'https://picsum.photos/seed/dave/100', role: 'AI Engineer', skills: ['Python', 'PyTorch', 'LLMs'], bio: 'Bridging the gap between theory and product in AI.', projectsCount: 5, location: 'Austin, TX', availability: 'Looking for Team', links: [], pastProjectsList: [], lookingFor: [] },
];

const Matchmaker: React.FC<MatchmakerProps> = ({ currentUser }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [thoughts, setThoughts] = useState<string>("");

  // Bio Generation State
  const [githubUrl, setGithubUrl] = useState("");
  const [generatingBio, setGeneratingBio] = useState(false);
  const [userBio, setUserBio] = useState(currentUser.bio);

  const handleGenerateBio = async () => {
    if (!githubUrl) return;
    setGeneratingBio(true);
    try {
      const bio = await generateBio(githubUrl);
      setUserBio(bio);
      const sessionId = localStorage.getItem('session_id');
      if (sessionId) {
        await updateBio(sessionId, bio);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate bio.");
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleAnalyze = async (builder: Builder) => {
    setAnalyzing(true);
    setSelectedBuilder(builder);
    try {
      const updatedCurrentUser = { ...currentUser, bio: userBio };
      const integratedResult: IntegratedMatchResult = await getMatchAnalysis(updatedCurrentUser, builder);
      setAnalysis(integratedResult.result);
      setThoughts(integratedResult.thoughts);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze match. Check console.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Partners<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          The Synergy Engine by Yahya. Find long-term co-founders through high-reasoning AI analysis.
        </p>
      </div>

      {/* Generate Bio Section */}
      <div className="mb-12 glass p-6 rounded-3xl border border-indigo-500/20 max-w-2xl mx-auto">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={20} />
          Optimize Your Profile
        </h3>
        <div className="flex gap-3">
          <div className="relative flex-grow">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Enter GitHub URL (e.g. github.com/username)"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleGenerateBio}
            disabled={generatingBio || !githubUrl}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-600/20"
          >
            {generatingBio ? <Loader2 className="animate-spin" size={18} /> : "Generate Bio ✨"}
          </button>
        </div>
        {userBio !== currentUser.bio && (
          <div className="mt-4 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
            <p className="text-xs text-indigo-400 font-bold uppercase mb-1">New AI Bio Generated:</p>
            <p className="text-sm text-slate-300 italic">"{userBio}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {CANDIDATES.map(builder => (
          <div key={builder.id} className="relative group">
            <BuilderCard builder={builder} onSelect={() => handleAnalyze(builder)} />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-indigo-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-white">
                New Prospect
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Section */}
      {selectedBuilder && (
        <div className="glass p-8 rounded-3xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex -space-x-6">
              <img src={currentUser.avatar} className="w-24 h-24 rounded-full border-4 border-slate-900 ring-4 ring-indigo-500/20 shadow-xl" alt="" />
              <img src={selectedBuilder.avatar} className="w-24 h-24 rounded-full border-4 border-slate-900 ring-4 ring-purple-500/20 shadow-xl" alt="" />
            </div>

            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Match Analysis with {selectedBuilder.name}</h2>
                {analysis && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <span className="text-cyan-400 font-bold text-sm">{analysis.compatibility_score}% Synergy</span>
                  </div>
                )}
              </div>

              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-medium">Scouting compatibility...</p>
                </div>
              ) : analysis ? (
                <div className="grid grid-cols-1 gap-8">
                  {/* NEW: Cognitive Reasoning Section */}
                  {thoughts && (
                    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                          <BrainCircuit size={16} className="text-indigo-400" />
                        </div>
                        <h4 className="text-indigo-400 text-[11px] font-bold uppercase tracking-[0.2em]">Cognitive Reasoning Trace</h4>
                      </div>
                      <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-slate-400 text-xs font-mono leading-relaxed opacity-80">
                          {thoughts}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2">Synergy Analysis</h4>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{analysis.synergy_analysis}</p>
                  </div>

                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                    <h4 className="text-purple-400 text-xs font-bold uppercase mb-4">Recommended First Dates (Hackathons)</h4>
                    <div className="space-y-4">
                      {analysis.hackathons?.map((hackathon: any, index: number) => (
                        <div key={index} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-white font-bold">{hackathon.name}</h5>
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{hackathon.date}</span>
                          </div>
                          <p className="text-xs text-indigo-400 mb-2">{hackathon.location}</p>
                          <p className="text-slate-400 text-sm italic">"{hackathon.reasoning}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matchmaker;
