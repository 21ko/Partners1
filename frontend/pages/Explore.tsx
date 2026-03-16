import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Builder } from '../types';
import { authService, API_URL, safeJson } from '../services/authService';

const AVAILABILITY_LABELS: Record<string, string> = {
  this_weekend: '🟢 THIS_WEEKEND',
  this_month: '🟡 THIS_MONTH',
  open: '🔵 OPEN_FOR_COLLAB',
  busy: '🔴 BUSY_SHIPPING',
};

const TYPE_STYLES: Record<string, { border: string; badge: string; dot: string }> = {
  hackathon: {
    border: 'border-terminal-green/40 hover:border-terminal-green',
    badge: 'bg-terminal-green/10 text-terminal-green border-terminal-green/30',
    dot: 'bg-terminal-green',
  },
  interest: {
    border: 'border-terminal-blue/40 hover:border-terminal-blue',
    badge: 'bg-terminal-blue/10 text-terminal-blue border-terminal-blue/30',
    dot: 'bg-terminal-blue',
  },
  stack: {
    border: 'border-purple-500/40 hover:border-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
  },
  design: {
    border: 'border-pink-500/40 hover:border-pink-400',
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    dot: 'bg-pink-400',
  },
  general: {
    border: 'border-slate-700 hover:border-slate-600',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    dot: 'bg-slate-500',
  },
};

interface Community {
  id: string;
  name: string;
  description: string;
  type: string;
  members_count: number;
  event_date?: string;
}

const Explore: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingComms, setLoadingComms] = useState(true);
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [members, setMembers] = useState<Builder[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [matchLoading, setMatchLoading] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [matchedBuilder, setMatchedBuilder] = useState<Builder | null>(null);

  const session = authService.getSession();

  // ── fetch communities ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingComms(true);
      try {
        const res = await fetch(`${API_URL}/communities`);
        const data = await safeJson(res);
        setCommunities(data);
      } catch (e) {
        console.error('Failed to fetch communities', e);
      } finally {
        setLoadingComms(false);
      }
    };
    load();
  }, []);

  // ── open community → fetch members ────────────────────────────
  const openCommunity = async (comm: Community) => {
    setSelectedComm(comm);
    setMembers([]);
    setMatchResult(null);
    setLoadingMembers(true);
    try {
      const res = await fetch(`${API_URL}/communities/${comm.id}/members`);
      const data = await safeJson(res);
      setMembers(data.members || []);
    } catch (e) {
      console.error('Failed to fetch members', e);
    } finally {
      setLoadingMembers(false);
    }
  };

  // ── join community ─────────────────────────────────────────────
  const handleJoin = async (comm: Community, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.session_id || joinedIds.has(comm.id)) return;
    setJoiningId(comm.id);
    try {
      await authService.joinCommunity(comm.id);
      setJoinedIds(prev => new Set([...prev, comm.id]));
      setCommunities(prev =>
        prev.map(c => c.id === comm.id ? { ...c, members_count: c.members_count + 1 } : c)
      );
    } catch (e) {
      console.error('Join failed', e);
    } finally {
      setJoiningId(null);
    }
  };

  // ── check chemistry with a member ─────────────────────────────
  const handleMatch = async (builder: Builder) => {
    if (!session?.session_id) return;
    setMatchLoading(builder.username);
    setMatchResult(null);
    setMatchedBuilder(builder);
    try {
      const res = await fetch(
        `${API_URL}/match/${builder.username}?session_id=${session.session_id}`,
        { method: 'POST' }
      );
      const data = await safeJson(res);
      setMatchResult(data);
    } catch (e) {
      console.error('Match failed', e);
    } finally {
      setMatchLoading(null);
    }
  };

  // ── split communities ──────────────────────────────────────────
  const hackathons = communities.filter(c => c.type === 'hackathon');
  const regularComms = communities.filter(c => c.type !== 'hackathon');

  // ── member search (frontend filter) ───────────────────────────
  const filteredMembers = members.filter(b => {
    const s = search.toLowerCase();
    if (!s) return true;
    return (
      b.username.toLowerCase().includes(s) ||
      (b.bio || '').toLowerCase().includes(s) ||
      (b.github_languages || []).some(l => l.toLowerCase().includes(s))
    );
  });

  const styles = TYPE_STYLES[selectedComm?.type || 'general'] || TYPE_STYLES.general;

  return (
    <div className="space-y-12">

      {/* ── HACKATHONS ─────────────────────────────────────────── */}
      {(loadingComms || hackathons.length > 0) && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-terminal-green font-mono font-black text-lg">&gt;</span>
            <h2 className="text-xl font-black text-white">ACTIVE_HACKATHONS</h2>
            <span className="text-[10px] font-mono text-terminal-green border border-terminal-green/30 px-2 py-0.5 rounded animate-pulse">
              LIVE
            </span>
          </div>

          {loadingComms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-44 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hackathons.map((comm, i) => (
                <HackathonCard
                  key={comm.id}
                  comm={comm}
                  delay={i * 0.07}
                  joined={joinedIds.has(comm.id)}
                  joining={joiningId === comm.id}
                  onOpen={() => openCommunity(comm)}
                  onJoin={(e) => handleJoin(comm, e)}
                  loggedIn={!!session}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── ALL COMMUNITIES ────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-terminal-blue font-mono font-black text-lg">&gt;</span>
          <h2 className="text-xl font-black text-white">ALL_COMMUNITIES</h2>
          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-0.5 rounded">
            {communities.length} SECTORS
          </span>
        </div>

        {loadingComms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 border-dashed rounded-2xl">
            <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">No_Sectors_Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regularComms.map((comm, i) => (
              <CommunityCard
                key={comm.id}
                comm={comm}
                delay={i * 0.05}
                joined={joinedIds.has(comm.id)}
                joining={joiningId === comm.id}
                onOpen={() => openCommunity(comm)}
                onJoin={(e) => handleJoin(comm, e)}
                loggedIn={!!session}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── COMMUNITY PANEL ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedComm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedComm(null); setMatchResult(null); }}
              className="absolute inset-0 bg-[#060A14]/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className={`relative z-10 w-full max-w-2xl bg-[#0A0F1C] border ${styles.border} rounded-3xl overflow-hidden shadow-2xl flex flex-col`}
              style={{ maxHeight: '90vh' }}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${styles.badge}`}>
                      {selectedComm.type.toUpperCase()}
                    </span>
                    <h3 className="text-2xl font-black text-white">{selectedComm.name}</h3>
                    <p className="text-slate-400 text-sm italic">"{selectedComm.description}"</p>
                  </div>
                  <button
                    onClick={() => { setSelectedComm(null); setMatchResult(null); }}
                    className="text-slate-500 hover:text-white font-mono text-xs transition-colors ml-4 flex-shrink-0"
                  >
                    [CLOSE_X]
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedComm.members_count} builders in sector
                  </span>
                  {session && !joinedIds.has(selectedComm.id) && (
                    <button
                      onClick={(e) => handleJoin(selectedComm, e)}
                      disabled={joiningId === selectedComm.id}
                      className={`text-[10px] font-mono font-black px-4 py-1.5 rounded-lg border transition-all ${styles.badge} hover:opacity-80`}
                    >
                      {joiningId === selectedComm.id ? 'JOINING...' : '+ JOIN_SECTOR'}
                    </button>
                  )}
                  {joinedIds.has(selectedComm.id) && (
                    <span className="text-[10px] font-mono text-terminal-green">✓ JOINED</span>
                  )}
                </div>
              </div>

              {/* Match result (inline) */}
              <AnimatePresence>
                {matchResult && matchedBuilder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-slate-800 bg-terminal-green/5 overflow-hidden flex-shrink-0"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-terminal-green uppercase tracking-widest">
                          Chemistry_Result
                        </span>
                        <button onClick={() => setMatchResult(null)} className="text-slate-600 hover:text-slate-400 font-mono text-[10px]">
                          [dismiss]
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-black text-terminal-green font-mono">
                          {matchResult.chemistry_score}%
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${matchResult.chemistry_score}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-terminal-green rounded-full"
                            />
                          </div>
                          <p className="text-terminal-green text-xs font-mono">{matchResult.vibe}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        <span className="text-terminal-green mr-1">&gt;</span>{matchResult.why}
                      </p>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Build_Idea</p>
                        <p className="text-white text-xs italic">"{matchResult.build_idea}"</p>
                      </div>
                      {/* GitHub link */}
                      <a
                        href={`https://github.com/${matchedBuilder.github_username || matchedBuilder.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-mono text-slate-400 hover:text-white transition-colors"
                      >
                        <span className="text-terminal-green">→</span>
                        github.com/{matchedBuilder.github_username || matchedBuilder.username}
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Member search */}
              <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
                <input
                  type="text"
                  placeholder="SEARCH_MEMBERS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-terminal-green font-mono text-xs focus:ring-1 focus:ring-terminal-green outline-none placeholder-slate-700"
                />
              </div>

              {/* Members list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4">
                  {filteredMembers.length} builder{filteredMembers.length !== 1 ? 's' : ''} detected
                </p>

                {loadingMembers ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-slate-600 font-mono text-xs uppercase">No_Builders_In_Sector</p>
                    <p className="text-slate-700 font-mono text-[10px] mt-2">Be the first to join</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <MemberRow
                      key={member.username}
                      member={member}
                      onMatch={() => handleMatch(member)}
                      matchLoading={matchLoading === member.username}
                      isCurrentUser={member.username === session?.profile?.username}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/20 flex-shrink-0 text-center">
                <button
                  onClick={() => { setSelectedComm(null); setMatchResult(null); }}
                  className="text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest"
                >
                  Return_To_Directory
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Hackathon Card ──────────────────────────────────────────────

interface CardProps {
  comm: Community;
  delay: number;
  joined: boolean;
  joining: boolean;
  onOpen: () => void;
  onJoin: (e: React.MouseEvent) => void;
  loggedIn: boolean;
}

const HackathonCard: React.FC<CardProps> = ({ comm, delay, joined, joining, onOpen, onJoin, loggedIn }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onOpen}
    className="group relative bg-[#0D1525] border border-terminal-green/20 hover:border-terminal-green/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 overflow-hidden"
  >
    {/* Glow */}
    <div className="absolute inset-0 bg-terminal-green/0 group-hover:bg-terminal-green/[0.03] transition-colors pointer-events-none" />

    <div className="relative z-10 space-y-4">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-terminal-green/10 text-terminal-green border border-terminal-green/30 rounded">
          HACKATHON
        </span>
        <span className="text-terminal-green font-mono text-sm font-black">
          {comm.members_count} builders
        </span>
      </div>

      <div>
        <h3 className="text-white font-black text-lg group-hover:text-terminal-green transition-colors">
          {comm.name.replace(/ /g, '_')}
        </h3>
        <p className="text-slate-500 text-[11px] font-mono mt-1 line-clamp-2 uppercase leading-relaxed">
          {comm.description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (comm.members_count / 30) * 100)}%` }}
            transition={{ duration: 1, delay: delay + 0.3 }}
            className="h-full bg-terminal-green rounded-full"
          />
        </div>
        <p className="text-[9px] font-mono text-slate-600">{comm.members_count}/30 builders joined</p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[9px] font-mono text-slate-600 uppercase">Click to explore members</span>
        {loggedIn && (
          <button
            onClick={onJoin}
            disabled={joined || joining}
            className={`text-[10px] font-mono font-black px-4 py-1.5 rounded-lg transition-all ${joined
              ? 'text-terminal-green border border-terminal-green/30 cursor-default'
              : 'bg-terminal-green text-[#0A0F1C] hover:opacity-90'
              }`}
          >
            {joining ? '...' : joined ? '✓ JOINED' : 'JOIN'}
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

// ── Regular Community Card ──────────────────────────────────────

const CommunityCard: React.FC<CardProps> = ({ comm, delay, joined, joining, onOpen, onJoin, loggedIn }) => {
  const s = TYPE_STYLES[comm.type] || TYPE_STYLES.general;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onOpen}
      className={`group bg-[#0D1525] border ${s.border} rounded-2xl p-5 cursor-pointer transition-all duration-300 space-y-4`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${s.badge}`}>
          {comm.type.toUpperCase()}
        </span>
        <span className="text-[10px] font-mono text-slate-500">{comm.members_count} members</span>
      </div>

      <div>
        <h4 className="text-white font-bold group-hover:text-white transition-colors">
          {comm.name.replace(/ /g, '_')}
        </h4>
        <p className="text-slate-500 text-[10px] font-mono mt-1 line-clamp-2 uppercase leading-relaxed">
          {comm.description}
        </p>
      </div>

      {/* Progress */}
      <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (comm.members_count / 50) * 100)}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className={`h-full ${s.dot} rounded-full`}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-slate-700 uppercase">View members →</span>
        {loggedIn && (
          <button
            onClick={onJoin}
            disabled={joined || joining}
            className={`text-[9px] font-mono font-black px-3 py-1 rounded-lg border transition-all ${joined
              ? `${s.badge} cursor-default`
              : `${s.badge} hover:opacity-80`
              }`}
          >
            {joining ? '...' : joined ? '✓ JOINED' : '+ JOIN'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Member Row ──────────────────────────────────────────────────

interface MemberRowProps {
  member: Builder;
  onMatch: () => void;
  matchLoading: boolean;
  isCurrentUser: boolean;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onMatch, matchLoading, isCurrentUser }) => (
  <div className="group p-4 bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-all">
    <div className="flex items-center gap-3 min-w-0">
      <img
        src={member.avatar}
        className="w-10 h-10 rounded-lg border border-slate-800 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all"
        alt=""
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`;
        }}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm truncate">@{member.username}</span>
          {isCurrentUser && (
            <span className="text-[9px] font-mono text-terminal-green border border-terminal-green/30 px-1.5 rounded">YOU</span>
          )}
        </div>
        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
          {member.bio || 'STAYING_LOW_PROFILE'}
        </div>
        <div className="flex gap-1 mt-1">
          {(member.github_languages || []).slice(0, 3).map(l => (
            <span key={l} className="text-[8px] font-mono px-1 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>

    {!isCurrentUser && (
      <button
        onClick={onMatch}
        disabled={matchLoading}
        className="flex-shrink-0 ml-3 text-[10px] font-mono font-black px-3 py-2 rounded-lg border border-terminal-blue/30 text-terminal-blue hover:bg-terminal-blue hover:text-[#0A0F1C] transition-all disabled:opacity-50 relative overflow-hidden"
      >
        <span className="relative z-10">
          {matchLoading ? '...' : 'CHEMISTRY'}
        </span>
        {matchLoading && (
          <motion.div
            className="absolute inset-0 bg-terminal-blue/20"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </button>
    )}
  </div>
);

export default Explore;