import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Target, Zap, Globe2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none" />

      <main className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <Sparkles size={14} className="text-indigo-400" />
          <span className="text-xs font-medium tracking-wide uppercase text-zinc-300">Opportune 2.0 is Live</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1] mb-6">
          Find your next <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
            breakthrough.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          The AI-powered opportunity aggregator for ambitious students. 
          Discover hackathons, research programs, scholarships, and internships tailored to your profile.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            to="/register" 
            className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Get Started
            <ArrowRight size={18} />
          </Link>
          <Link 
            to="/login" 
            className="flex items-center gap-2 px-8 py-4 rounded-full font-medium border border-white/10 hover:bg-white/5 transition-colors"
          >
            Log In
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
          <Feature 
            icon={<Target className="text-indigo-400" />}
            title="Smart Matching"
            desc="Our AI analyzes your profile to recommend the highest-leverage opportunities for your career."
          />
          <Feature 
            icon={<Zap className="text-emerald-400" />}
            title="Application Copilot"
            desc="Brainstorm essays and get instant feedback on your resume with our integrated LLM mentors."
          />
          <Feature 
            icon={<Globe2 className="text-purple-400" />}
            title="Global Reach"
            desc="From Oxford scholarships to Silicon Valley internships, explore thousands of vetted programs."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="glass-card p-6 border border-white/10 bg-white/[0.02]">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}
