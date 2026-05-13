import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import OpportunityCard from '@/components/OpportunityCard';
import { Search, Filter } from 'lucide-react';

const TYPES = ["all", "hackathon", "scholarship", "internship", "research", "olympiad", "competition", "leadership"];
const GRADES = ["all", "high_school", "undergrad", "grad", "professional"];

export default function Explorer() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters
  const [type, setType] = useState('all');
  const [grade, setGrade] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (type !== 'all') params.type = type;
      if (grade !== 'all') params.grade_level = grade;
      
      const res = await api.get('/opportunities', { params });
      setOpps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(delay);
  }, [search, type, grade]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Explore</h1>
        <p className="text-zinc-400 mt-1 text-sm">Discover and filter through thousands of verified opportunities.</p>
      </header>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by keyword, organization..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={type} onChange={e => setType(e.target.value)}
            className="bg-[#121214] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 capitalize"
          >
            <option value="all">All Types</option>
            {TYPES.filter(t=>t!=='all').map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <select 
            value={grade} onChange={e => setGrade(e.target.value)}
            className="bg-[#121214] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 capitalize"
          >
            <option value="all">All Grades</option>
            {GRADES.filter(t=>t!=='all').map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 glass-card animate-pulse" />)}
        </div>
      ) : opps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opps.map(o => <OpportunityCard key={o.id} opp={o} />)}
        </div>
      ) : (
        <div className="glass-card py-20 text-center flex flex-col items-center justify-center">
          <Filter size={32} className="text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium">No results found</h3>
          <p className="text-zinc-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}
