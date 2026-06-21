"use client";

import React from "react";
import Navbar from "./site/components/Navbar";
import Hero from "./site/components/Hero";
// import Features from "./site/components/Features";
// import Pricing from "./site/components/Pricing";
// import Footer from "./site/components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative selection:bg-indigo-500/30">
      {/* Strategic Background Lighting Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="lighting-glow bg-indigo-600/10 w-[800px] h-[800px] -top-1/4 -left-1/4"></div>
        <div className="lighting-glow bg-purple-600/5 w-[600px] h-[600px] top-1/3 -right-1/4"></div>
        <div className="lighting-glow bg-blue-600/10 w-[700px] h-[700px] -bottom-1/4 left-1/3"></div>
      </div>

      <div className="relative z-10">
        <Navbar />

        <main>
          <Hero />

          {/*<div className="relative">
            <div className="lighting-glow bg-indigo-500/10 w-[500px] h-[500px] top-0 left-0"></div>
            <Features />
          </div>

          <Pricing />

          <section className="py-32">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <div className="relative glass-card p-12 md:p-24 rounded-[4rem] border border-white/10 overflow-hidden group">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full"></div>

                <div className="relative z-10">
                  <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
                    Ready for <span className="gradient-text">Invoxa?</span>
                  </h2>
                  <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Elevate your business billing to professional standards.
                    Join thousands of high-performing teams today.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <button className="px-12 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-2xl shadow-white/5 active:scale-95">
                      Get Started Now
                    </button>
                    <button className="px-12 py-5 bg-slate-900 border border-white/10 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95">
                      Contact Sales
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>*/}
        </main>

        {/*<Footer />*/}
      </div>
    </div>
  );
}

export default App;
