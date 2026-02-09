
import React, { useState } from 'react';
import { Builder, PastProject, Link } from '../types';
import { authService } from '../services/authService';

interface ProfileProps {
  user: Builder;
  onUpdate: (updatedUser: Builder) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Builder>(user);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update bio on backend if it changed
      if (formData.bio !== user.bio) {
        await authService.updateBio(formData.bio);
      }
      onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const addProject = () => {
    const newProj: PastProject = { id: Date.now().toString(), title: '', description: '' };
    setFormData({ ...formData, pastProjectsList: [...formData.pastProjectsList, newProj] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="glass p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className={`px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isEditing ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-white text-slate-900 hover:bg-indigo-50'
              }`}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="relative group">
            <img src={formData.avatar} className="w-32 h-32 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-2xl" alt="Avatar" />
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-xs font-bold">Change</span>
              </div>
            )}
          </div>

          <div className="flex-grow space-y-4 text-center md:text-left">
            <div>
              {isEditing ? (
                <input
                  className="bg-slate-800 border border-slate-700 text-3xl font-bold text-white rounded-lg px-2 w-full focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <h1 className="text-4xl font-extrabold text-white">{formData.name}</h1>
              )}
              <p className="text-indigo-400 font-medium mt-1">{formData.role}</p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <span className="text-slate-400 text-sm flex items-center gap-1">📍 {formData.location}</span>
              <span className="text-slate-400 text-sm flex items-center gap-1">🚀 {formData.pastProjectsList.length} Projects</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-8">
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">About Me</h3>
            {isEditing ? (
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-300 h-32 focus:ring-2 focus:ring-indigo-500"
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            ) : (
              <p className="text-slate-300 leading-relaxed">{formData.bio}</p>
            )}
          </section>

          <section className="glass p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Past Projects</h3>
              {isEditing && (
                <button onClick={addProject} className="text-xs text-indigo-400 font-bold hover:text-indigo-300">+ Add Project</button>
              )}
            </div>
            <div className="space-y-4">
              {formData.pastProjectsList.map((proj, idx) => (
                <div key={proj.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-colors">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold"
                        placeholder="Project Title"
                        value={proj.title}
                        onChange={e => {
                          const newList = [...formData.pastProjectsList];
                          newList[idx].title = e.target.value;
                          setFormData({ ...formData, pastProjectsList: newList });
                        }}
                      />
                      <textarea
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-400 text-sm"
                        placeholder="Description"
                        value={proj.description}
                        onChange={e => {
                          const newList = [...formData.pastProjectsList];
                          newList[idx].description = e.target.value;
                          setFormData({ ...formData, pastProjectsList: newList });
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-white">{proj.title || 'Untitled Project'}</h4>
                      <p className="text-sm text-slate-400 mt-1">{proj.description || 'No description provided.'}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Skills & Looking For */}
        <div className="space-y-8">
          <section className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Core Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.skills.map(skill => (
                <span key={skill} className="group relative px-3 py-1 bg-slate-800 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20">
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <input
                type="text"
                placeholder="Add skill... (Press Enter)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            )}
          </section>

          <section className="glass p-6 rounded-2xl border-l-4 border-purple-500">
            <h3 className="text-lg font-bold text-white mb-4">Looking For</h3>
            <div className="space-y-2">
              {['Co-founder', 'Frontend Dev', 'Backend Dev', 'Designer', 'Investor'].map(role => (
                <label key={role} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={formData.lookingFor.includes(role)}
                    onChange={(e) => {
                      const newList = e.target.checked
                        ? [...formData.lookingFor, role]
                        : formData.lookingFor.filter(r => r !== role);
                      setFormData({ ...formData, lookingFor: newList });
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-sm font-medium ${formData.lookingFor.includes(role) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
