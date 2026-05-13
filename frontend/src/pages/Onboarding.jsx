import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const INTERESTS = [
  "Computer Science", "Artificial Intelligence", "Biology", "Medicine", 
  "Physics", "Mathematics", "Engineering", "Business", "Finance", 
  "Entrepreneurship", "Art & Design", "Writing", "Law", "Social Sciences"
];

export default function Onboarding() {
  const [grade, setGrade] = useState('');
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState([]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const toggleInterest = (i) => {
    if (interests.includes(i)) setInterests(interests.filter(x => x !== i));
    else if (interests.length < 5) setInterests([...interests, i]);
  };

  const handleSubmit = async () => {
    if (!grade || !country || interests.length === 0) {
      return toast.error("Please fill out all fields");
    }
    setBusy(true);
    try {
      const res = await api.post('/auth/onboard', { grade_level: grade, country, interests });
      setUser(res.data);
      navigate('/dashboard');
    } catch (e) {
      toast.error("Failed to save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-display font-medium text-white tracking-tight">Tell us about yourself</h2>
          <p className="mt-2 text-zinc-400">We'll use this to recommend the best opportunities for you.</p>
        </div>

        <div className="glass-card p-8 space-y-8 border border-white/10">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">What is your current education level?</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['high_school', 'undergrad', 'grad', 'professional'].map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`px-4 py-3 border rounded-lg text-sm font-medium capitalize transition-colors ${
                    grade === g ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {g.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Where are you based?</label>
            <select
              value={country} onChange={e => setCountry(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a country</option>
              <option value="USA">United States</option>
              <option value="India">India</option>
              <option value="UK">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Global">Other (Global)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">What are your interests? (Select up to 5)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => {
                const selected = interests.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {i}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleSubmit} disabled={busy}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
