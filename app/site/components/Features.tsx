
import React from 'react';
import { FEATURES } from './constants';

const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-indigo-400 font-bold tracking-[0.2em] uppercase text-xs mb-4">Core Ecosystem</h2>
          <h3 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">The Invoxa Difference</h3>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
            Engineered for precision. Designed for performance. The most comprehensive invoicing platform ever built.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {FEATURES.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative p-10 glass-card rounded-[2.5rem] hover:bg-slate-800/40 transition-all duration-500 cursor-default hover:-translate-y-2 border border-white/5 hover:border-indigo-500/30"
            >
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl rounded-full"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-300 shadow-xl">
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h4>
                <p className="text-slate-400 leading-relaxed text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
