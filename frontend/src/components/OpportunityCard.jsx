import React, { useState } from 'react';
import { Bookmark, ExternalLink, Calendar, MapPin, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function OpportunityCard({ opp }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveOpp = async () => {
    setSaving(true);
    try {
      const res = await api.post('/bookmarks', { opportunity_id: opp.id });
      if (res.data.ok) {
        setSaved(true);
        toast.success(res.data.duplicate ? 'Already saved' : 'Saved to bookmarks');
      }
    } catch {
      toast.error('Failed to save opportunity');
    } finally {
      setSaving(false);
    }
  };

  const daysLeft = () => {
    const d = new Date(opp.deadline);
    const today = new Date();
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Due today';
    return `${diff} days left`;
  };

  return (
    <div className="glass-card p-5 group flex flex-col hover:border-white/20 transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full bg-white/5 text-xs font-medium text-zinc-300 mb-3 border border-white/5 uppercase tracking-wider">
            {opp.type}
          </span>
          <h3 className="font-display text-lg font-medium leading-tight group-hover:text-indigo-400 transition-colors">
            {opp.title}
          </h3>
          <p className="text-zinc-400 text-sm mt-1">{opp.organization}</p>
        </div>
        <button 
          onClick={saveOpp} 
          disabled={saving}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-indigo-400' : ''} />
        </button>
      </div>

      <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">
        {opp.description}
      </p>

      <div className="space-y-2 mb-5">
        <div className="flex items-center text-xs text-zinc-400 gap-2">
          <Calendar size={14} className="text-zinc-500" />
          <span>Deadline: <span className="text-zinc-300">{new Date(opp.deadline).toLocaleDateString()}</span> ({daysLeft()})</span>
        </div>
        <div className="flex items-center text-xs text-zinc-400 gap-2">
          <MapPin size={14} className="text-zinc-500" />
          <span>{opp.remote ? 'Remote / Online' : opp.country}</span>
        </div>
        {opp.prize && (
          <div className="flex items-center text-xs text-zinc-400 gap-2">
            <Award size={14} className="text-emerald-500/70" />
            <span className="text-emerald-400/90 font-medium">{opp.prize}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex gap-1 flex-wrap">
          {opp.tags?.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-400">
              {t}
            </span>
          ))}
        </div>
        <a 
          href={opp.url} 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
        >
          Apply <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
