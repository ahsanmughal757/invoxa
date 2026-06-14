
import React from 'react';
import { PRICING_PLANS } from './constants';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-indigo-400 font-semibold tracking-wide uppercase text-sm mb-4">Pricing</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple, Honest Pricing</h3>
          <p className="max-w-2xl mx-auto text-lg text-slate-400">
            No hidden fees. No surprise upgrades. Just high-quality invoicing for every stage of your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative p-8 rounded-3xl transition-all duration-300 ${
                plan.popular 
                ? 'bg-slate-800 ring-2 ring-indigo-500 scale-105 z-10' 
                : 'glass-card border border-white/5 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                <p className="text-slate-400 text-sm h-10">{plan.description}</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xl text-slate-500 font-medium">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start text-sm text-slate-300">
                    <Check className="mr-3 w-5 h-5 text-indigo-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${
                plan.popular 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}>
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
