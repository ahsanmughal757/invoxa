
import React from 'react';
import { PORTFOLIO } from './constants';
import { ExternalLink } from 'lucide-react';

const Showcase: React.FC = () => {
  return (
    <section id="platform" className="py-24 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-indigo-400 font-semibold tracking-wide uppercase text-sm mb-4">Platform</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Experience Financial Mastery</h3>
            <p className="text-lg text-slate-400 leading-relaxed">
              We've obsessed over every pixel to ensure that managing your billing is as satisfying as getting paid.
            </p>
          </div>
          <button className="flex items-center text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            View all capabilities <ExternalLink className="ml-2 w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {PORTFOLIO.map((item, idx) => (
            <div key={idx} className="group relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full transform transition-transform duration-500 group-hover:-translate-y-2">
                <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2 block">{item.category}</span>
                <h4 className="text-2xl font-bold text-white mb-2">{item.title}</h4>
                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Showcase;
