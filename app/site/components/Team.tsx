
import React from 'react';
import { TEAM } from './constants';
import { Linkedin, Twitter, Github } from 'lucide-react';

const Team: React.FC = () => {
  return (
    <section id="team" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-indigo-400 font-semibold tracking-wide uppercase text-sm mb-4">The Team</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Founded by Experts</h3>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
            Our mission is driven by a diverse group of passionate thinkers, designers, and engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {TEAM.map((member, idx) => (
            <div key={idx} className="group">
              <div className="relative mb-8 rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 aspect-square">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <h4 className="text-2xl font-bold text-white mb-1">{member.name}</h4>
              <p className="text-indigo-400 font-medium mb-4">{member.role}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {member.bio}
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
