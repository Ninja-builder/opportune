import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const useDemo = (role) => {
    setEmail(role === 'admin' ? 'admin@opportune.app' : 'demo@opportune.app');
    setPassword(role === 'admin' ? 'Admin@123' : 'Demo@123');
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="text-center block text-2xl font-display font-semibold mb-2">Opportune</Link>
        <h2 className="mt-6 text-center text-3xl font-display font-medium tracking-tight text-white">
          Welcome back
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-white/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email address</label>
              <div className="mt-1">
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Password</label>
              <div className="mt-1">
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit" disabled={busy}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#09090B] disabled:opacity-50 transition-colors"
              >
                {busy ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#121214] text-zinc-500">Test Accounts</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => useDemo('student')} className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-transparent text-sm font-medium text-zinc-300 hover:bg-white/5">
                Student
              </button>
              <button onClick={() => useDemo('admin')} className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-transparent text-sm font-medium text-zinc-300 hover:bg-white/5">
                Admin
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-zinc-400">
            Don't have an account? <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
