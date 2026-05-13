import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import OpportunityCard from '@/components/OpportunityCard';
import { BookmarkMinus } from 'lucide-react';

export default function Saved() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/bookmarks');
        setOpps(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Saved Opportunities</h1>
        <p className="text-zinc-400 mt-1 text-sm">Your personal list of bookmarked programs.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-64 glass-card animate-pulse" />)}
        </div>
      ) : opps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opps.map(o => <OpportunityCard key={o.id} opp={o} />)}
        </div>
      ) : (
        <div className="glass-card py-20 text-center flex flex-col items-center justify-center">
          <BookmarkMinus size={32} className="text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium">No saved opportunities</h3>
          <p className="text-zinc-500 mt-1">When you bookmark an opportunity, it will appear here.</p>
        </div>
      )}
    </div>
  );
}
