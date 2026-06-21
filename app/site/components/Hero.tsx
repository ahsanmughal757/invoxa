import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";

const Hero: React.FC = () => {
  const { isSignedIn } = useUser();
  return (
    <section className="relative pt-32 pb-20 lg:pt-56 lg:pb-40 overflow-hidden">
      {/* Strategic Lighting Effects */}
      <div className="lighting-glow bg-indigo-500 w-[600px] h-[600px] -top-40 -left-40 opacity-20"></div>
      <div className="lighting-glow bg-purple-500 w-[500px] h-[500px] top-1/2 -right-20 opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Branding badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-10 transition-transform hover:scale-105 cursor-default">
          <Star className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
          <span className="text-sm font-bold text-indigo-300 uppercase tracking-[0.2em]">
            The Gold Standard Invoicing
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white tracking-tighter mb-8 leading-[0.9]">
          Invoxa
        </h1>

        <h2 className="text-3xl md:text-5xl font-bold text-slate-200 mb-8 tracking-tight max-w-4xl mx-auto">
          Invoicing for the Modern Era.
        </h2>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed">
          The ultimate financial operating system for companies and high-growth
          startups. Streamline accounts receivable, automate collections, and
          scale with confidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
          {isSignedIn && (
            <Link href="/dashboard">
              <button className="w-full sm:w-auto px-12 py-5 bg-white text-slate-950 font-black rounded-2xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center transition-all hover:bg-indigo-50 active:scale-95 group">
                GO TO DASHBOARD
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          )}
          <SignedOut>
            <SignInButton>
              <button className="w-full sm:w-auto px-12 py-5 bg-white text-slate-950 font-black rounded-2xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center transition-all hover:bg-indigo-50 active:scale-95 group">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
          {/*<button className="w-full sm:w-auto px-12 py-5 bg-white text-slate-950 font-black rounded-2xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center transition-all hover:bg-indigo-50 active:scale-95 group">
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>*/}
        </div>

        {/* Feature Pills */}
        {/*<div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-5xl mx-auto opacity-70">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
              SOC2 Type II Compliant
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
              Real-time Settlements
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
              Rated 4.9/5 by G2
            </span>
          </div>
        </div>*/}
      </div>

      {/* Hero Visual with Glow */}
      <div className="mt-32 max-w-6xl mx-auto px-4 relative">
        <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-[3rem] -z-10 animate-pulse"></div>
        <div className="relative glass-card rounded-[2.5rem] p-3 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 overflow-hidden">
          <img
            src={"/images/dashboard.png"}
            alt="Invoxa Dashboard"
            className="w-full rounded-[2rem] border border-white/5 shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
