import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics</h1>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 glass-card animate-pulse" />
          <div className="h-40 glass-card animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-zinc-400 mt-1 text-sm">Track your progress and application pipeline.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Total Saved</p>
          <p className="text-3xl font-display font-semibold">{data?.total_saved}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">AI Chats</p>
          <p className="text-3xl font-display font-semibold">{data?.total_chats}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="glass-card p-6">
          <h3 className="font-medium mb-6">Activity (Last 8 Weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_activity}>
                <XAxis dataKey="week" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                />
                <Bar dataKey="saved" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="glass-card p-6">
          <h3 className="font-medium mb-6">Saved by Type</h3>
          <div className="h-64 flex items-center justify-center">
            {data?.by_type?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_type}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                  >
                    {data.by_type.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-zinc-500 text-sm">Not enough data</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon size={18} className="text-indigo-400" />
          <h3 className="font-medium">Upcoming Deadlines</h3>
        </div>
        
        {data?.upcoming_deadlines?.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.upcoming_deadlines.map((d, i) => {
              const date = new Date(d.deadline);
              const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{d.type}</p>
                  </div>
                  <div className={`text-sm flex items-center gap-1.5 ${diff <= 7 ? 'text-red-400' : 'text-zinc-400'}`}>
                    <Clock size={14} />
                    {diff === 0 ? 'Today' : `${diff}d`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No upcoming deadlines.</p>
        )}
      </div>
    </div>
  );
}
