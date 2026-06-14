
import React from 'react';
import { TESTIMONIALS } from './constants';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">Trusted by 12,000+ Teams</h3>
          <div className="flex justify-center space-x-1 mb-8">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="glass-card p-8 rounded-3xl relative">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full border-4 border-slate-900 overflow-hidden">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="pt-4">
                    <p className="text-slate-300 italic mb-8 leading-relaxed">"{t.content}"</p>
                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                        <div>
                            <div className="text-white font-bold">{t.name}</div>
                            <div className="text-slate-500 text-sm">{t.role}</div>
                        </div>
                        <div className="text-indigo-400 font-bold">5.0</div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
