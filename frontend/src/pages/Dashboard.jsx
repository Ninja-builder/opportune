import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import OpportunityCard from '@/components/OpportunityCard';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recRes, trendRes] = await Promise.all([
          api.get('/opportunities/recommendations?limit=3'),
          api.get('/opportunities/trending?limit=3')
        ]);
        setRecommended(recRes.data);
        setTrending(trendRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-10 pb-10">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Here's what's happening in your opportunity feed today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/assistant" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Sparkles size={16} /> Copilot
          </Link>
          <Link to="/explorer" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Search size={16} /> Browse All
          </Link>
        </div>
      </header>

      {/* Recommended Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
            <Sparkles size={16} />
          </div>
          <h2 className="font-display text-xl font-medium">Top Matches for You</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 glass-card animate-pulse" />)}
          </div>
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map(o => <OpportunityCard key={o.id} opp={o} />)}
          </div>
        ) : (
          <div className="glass-card p-10 text-center text-zinc-500">
            No recommendations found. Try updating your profile interests.
          </div>
        )}
      </section>

      {/* Trending Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-md bg-orange-500/20 text-orange-400">
            <TrendingUp size={16} />
          </div>
          <h2 className="font-display text-xl font-medium">Trending Globally</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 glass-card animate-pulse" />)}
          </div>
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map(o => <OpportunityCard key={o.id} opp={o} />)}
          </div>
        ) : null}
      </section>

    </div>
  );
}
