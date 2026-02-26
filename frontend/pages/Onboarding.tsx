import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    ChevronRight,
    ChevronLeft,
    Code,
    Cpu,
    Layers,
    Zap,
    MessageSquare,
    Github,
    Mail,
    Phone
} from 'lucide-react';
import { Builder } from '../types';

interface OnboardingProps {
    initialProfile: Builder;
    sessionId: string;
    onComplete: (updatedProfile: Builder) => void;
}

const INTEREST_OPTIONS = [
    "AI tools", "Web apps", "Mobile apps", "Games",
    "Open Source", "Dev tools", "Creative coding", "Blockchain",
    "Robotics", "Data Visualization", "Cybersecurity", "IoT"
];

const STYLE_OPTIONS = [
    { id: 'ships_fast', label: 'Ships Fast', desc: 'Focus on MVP and speed' },
    { id: 'plans_first', label: 'Plans First', desc: 'Detailed architecture before code' },
    { id: 'designs_first', label: 'Designs First', desc: 'UI/UX excellence is priority' },
    { id: 'figures_it_out', label: 'Figures it Out', desc: 'Experimental and agile' }
];

const Onboarding: React.FC<OnboardingProps> = ({ initialProfile, sessionId, onComplete }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState<Builder>({
        ...initialProfile,
        interests: initialProfile.interests || [],
        building_style: initialProfile.building_style || 'figures_it_out',
        availability: initialProfile.availability || 'open',
        open_to: initialProfile.open_to || ['weekend projects'],
        learning: initialProfile.learning || [],
        experience_level: initialProfile.experience_level || 'intermediate'
    });

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const toggleInterest = (interest: string) => {
        setProfile(p => ({
            ...p,
            interests: p.interests.includes(interest)
                ? p.interests.filter(i => i !== interest)
                : [...p.interests, interest]
        }));
    };

    const handleComplete = async () => {
        try {
            setIsSubmitting(true);
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000'}/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    ...profile
                })
            });

            if (!res.ok) throw new Error('Update failed');
            const data = await res.json();
            onComplete(data.profile);
        } catch (error) {
            console.error(error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F1C] text-[#E2E8F0] flex items-center justify-center p-4 font-mono">
            <div className="max-w-xl w-full">
                {/* Progress Bar */}
                <div className="mb-8 flex justify-between items-center bg-[#162033] p-1 rounded-full overflow-hidden">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#00FF41]' : 'bg-transparent'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="p-6 bg-[#162033] border border-[#00FF41]/20 rounded-lg">
                                <h1 className="text-2xl font-bold text-[#00FF41] mb-4 flex items-center gap-2">
                                    <Zap className="w-6 h-6" /> WELCOME TO PARTNERS
                                </h1>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    You're one of the first 50 builders to join PulseBuild. We build for the sake of building.
                                </p>
                                <div className="space-y-4 p-4 bg-[#0A0F1C] rounded border border-[#00FF41]/10">
                                    <p className="text-sm text-[#8BE9FD]">Found a bug? Have an idea? Text or mail the founder:</p>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-[#BD93F9]" />
                                            <span>+33 7 61 28 91 74</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-[#BD93F9]" />
                                            <span>yahya.kossor@edu.ece.fr</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={nextStep}
                                className="w-full py-4 bg-[#00FF41] text-[#0A0F1C] font-bold rounded hover:bg-[#50FA7B] transition-colors flex items-center justify-center gap-2"
                            >
                                LEVEL UP <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-xl font-bold text-[#00FF41] mb-2 uppercase tracking-wider">What do you build?</h2>
                                <p className="text-gray-400 text-sm mb-6">Select your interests to help us find partners.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {INTEREST_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => toggleInterest(opt)}
                                            className={`p-3 text-sm border rounded transition-all ${profile.interests.includes(opt)
                                                    ? 'bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]'
                                                    : 'bg-[#162033] border-transparent hover:border-[#00FF41]/30 text-gray-400'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={prevStep} className="flex-1 py-4 border border-gray-700 rounded hover:bg-gray-800 transition-colors">BACK</button>
                                <button onClick={nextStep} className="flex-2 py-4 bg-[#00FF41] text-[#0A0F1C] font-bold rounded hover:bg-[#50FA7B] transition-colors">NEXT: SKILLS</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-[#00FF41] mb-4">EXPERIENCE LEVEL</h2>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['beginner', 'intermediate', 'advanced'].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => setProfile(p => ({ ...p, experience_level: lvl as any }))}
                                                className={`py-3 capitalize border rounded ${profile.experience_level === lvl
                                                        ? 'bg-[#BD93F9]/10 border-[#BD93F9] text-[#BD93F9]'
                                                        : 'bg-[#162033] border-transparent text-gray-400'
                                                    }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#00FF41] mb-4">WHAT ARE YOU LEARNING?</h2>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rust, LLMs, Three.js"
                                        className="w-full p-4 bg-[#162033] border border-transparent focus:border-[#00FF41]/50 rounded outline-none transition-all"
                                        value={profile.learning.join(', ')}
                                        onChange={(e) => setProfile(p => ({ ...p, learning: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={prevStep} className="flex-1 py-4 border border-gray-700 rounded hover:bg-gray-800 transition-colors">BACK</button>
                                <button onClick={nextStep} className="flex-2 py-4 bg-[#00FF41] text-[#0A0F1C] font-bold rounded hover:bg-[#50FA7B] transition-colors">NEXT: STYLE</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-xl font-bold text-[#00FF41] mb-6">BUILDING STYLE</h2>
                                <div className="space-y-3">
                                    {STYLE_OPTIONS.map(style => (
                                        <button
                                            key={style.id}
                                            onClick={() => setProfile(p => ({ ...p, building_style: style.id as any }))}
                                            className={`w-full p-4 text-left border rounded transition-all flex items-center justify-between group ${profile.building_style === style.id
                                                    ? 'bg-[#8BE9FD]/10 border-[#8BE9FD] text-[#8BE9FD]'
                                                    : 'bg-[#162033] border-transparent hover:bg-[#1c2a42]'
                                                }`}
                                        >
                                            <div>
                                                <div className="font-bold">{style.label}</div>
                                                <div className="text-xs text-gray-500">{style.desc}</div>
                                            </div>
                                            {profile.building_style === style.id && <Check className="w-5 h-5" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={prevStep} className="flex-1 py-4 border border-gray-700 rounded hover:bg-gray-800 transition-colors">BACK</button>
                                <button onClick={nextStep} className="flex-2 py-4 bg-[#00FF41] text-[#0A0F1C] font-bold rounded hover:bg-[#50FA7B] transition-colors">NEXT: FINAL INFO</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-[#00FF41] mb-4">OPEN TO...</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['weekend projects', 'hackathons', 'open source', 'freelance'].map(opt => (
                                            <label key={opt} className="flex items-center gap-3 p-3 bg-[#162033] rounded cursor-pointer group hover:bg-[#1c2a42]">
                                                <input
                                                    type="checkbox"
                                                    checked={profile.open_to.includes(opt)}
                                                    onChange={() => {
                                                        const newOpenTo = profile.open_to.includes(opt)
                                                            ? profile.open_to.filter(o => o !== opt)
                                                            : [...profile.open_to, opt];
                                                        setProfile(p => ({ ...p, open_to: newOpenTo }));
                                                    }}
                                                    className="w-4 h-4 accent-[#00FF41]"
                                                />
                                                <span className="text-sm capitalize">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#00FF41] mb-4">CURRENT IDEA? (OPTIONAL)</h2>
                                    <textarea
                                        placeholder="Building a better way to find partners..."
                                        className="w-full p-4 bg-[#162033] border border-transparent focus:border-[#00FF41]/50 rounded outline-none h-32 resize-none"
                                        value={profile.current_idea || ''}
                                        onChange={(e) => setProfile(p => ({ ...p, current_idea: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={prevStep} className="flex-1 py-4 border border-gray-700 rounded hover:bg-gray-800 transition-colors">BACK</button>
                                <button
                                    onClick={handleComplete}
                                    disabled={isSubmitting}
                                    className="flex-2 py-4 bg-[#00FF41] text-[#0A0F1C] font-bold rounded hover:bg-[#50FA7B] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'SYNCING...' : 'FINISH PROFILE'} <Check className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
