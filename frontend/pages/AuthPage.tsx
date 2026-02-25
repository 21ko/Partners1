import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';

interface AuthPageProps {
    onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [githubUsername, setGithubUsername] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await authService.login(username, password);
            } else {
                await authService.register(username, password, githubUsername);
            }
            onAuthSuccess();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0F1C]">
            <div className="w-full max-w-md space-y-8">
                <header className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-4 border-2 border-terminal-green rounded-2xl mb-4"
                    >
                        <span className="text-3xl font-black text-terminal-green font-mono tracking-tighter">PARTNERS</span>
                    </motion.div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">
                        {isLogin ? 'ACCESS_GRANTED' : 'INITIATE_ONBOARDING'}
                    </h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                        {isLogin ? 'Enter credentials to resume session' : 'Connect GitHub to build profile'}
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-terminal-green/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 ml-1 tracking-widest">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="off"
                                className="w-full bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-4 text-white font-mono text-sm focus:ring-1 focus:ring-terminal-green outline-none"
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 ml-1 tracking-widest">GitHub_Username</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">github.com/</span>
                                    <input
                                        type="text"
                                        required
                                        value={githubUsername}
                                        onChange={(e) => setGithubUsername(e.target.value)}
                                        className="w-full bg-[#0A0F1C] border border-slate-800 rounded-xl pl-28 pr-4 py-4 text-terminal-blue font-mono text-sm focus:ring-1 focus:ring-terminal-blue outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2 ml-1 tracking-widest">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-4 text-white font-mono text-sm focus:ring-1 focus:ring-terminal-green outline-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono p-3 rounded-xl uppercase text-center">
                            &gt; ERROR: {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-terminal-green text-[#0A0F1C] font-mono font-black py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,65,0.1)] uppercase"
                    >
                        {loading ? 'EXECUTING...' : isLogin ? 'SIGN_IN.EXE' : 'CREATE_ACCOUNT.OBJ'}
                    </button>

                    <footer className="text-center pt-4">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[10px] font-mono text-slate-500 hover:text-terminal-green transition-colors uppercase tracking-widest"
                        >
                            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                        </button>
                    </footer>
                </form>

                <p className="text-center text-[10px] font-mono text-slate-700 uppercase tracking-tighter">
                    Encryption Level: AES-256-BIT // SECURE_CHANNEL_READY
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
