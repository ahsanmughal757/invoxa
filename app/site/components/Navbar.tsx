"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, FileText } from "lucide-react";

import {
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Platform", href: "#platform" },
    { name: "Team", href: "#team" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "py-4 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10"
          : "py-8 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center transition-all shadow-lg group-hover:scale-110 group-hover:rotate-6 group-hover:bg-indigo-500">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">
              Invoice<span className="text-indigo-400">Pro</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors tracking-wide uppercase"
              >
                {link.name}
              </a>
            ))}

            <SignedIn>
              <UserButton />
            </SignedIn>
            {isSignedIn && (
              <Link href="/dashboard">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            )}
            <SignedOut>
              <SignInButton>
                <button className="px-8 py-3 bg-white text-slate-950 font-black rounded-xl hover:bg-indigo-50 transition-all active:scale-95 text-sm shadow-xl shadow-white/5">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute w-full transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "top-full opacity-100" : "-top-[500px] opacity-0"
        } bg-slate-900 border-b border-white/10 px-4 py-12`}
      >
        <div className="flex flex-col space-y-8 text-center">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xl font-bold text-slate-300 hover:text-white uppercase tracking-widest"
            >
              {link.name}
            </a>
          ))}
          <button className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl text-lg shadow-2xl shadow-indigo-500/20">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
