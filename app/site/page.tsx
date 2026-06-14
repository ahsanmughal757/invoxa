// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   ChevronDown,
//   CheckCircle,
//   Users,
//   Zap,
//   Shield,
//   ArrowRight,
//   Menu,
//   X,
//   Star,
//   Clock,
//   DollarSign,
//   FileText,
//   BarChart3,
//   Globe,
//   Mail,
//   Phone,
//   MapPin,
// } from "lucide-react";
// import {
//   ClerkProvider,
//   SignedIn,
//   SignedOut,
//   SignInButton,
//   UserButton,
// } from "@clerk/nextjs";

// const InvoiceProLanding = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [scrollY, setScrollY] = useState(0);
//   const [currentTestimonial, setCurrentTestimonial] = useState(0);

//   useEffect(() => {
//     const handleScroll = () => setScrollY(window.scrollY);
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
//     }, 4000);
//     return () => clearInterval(interval);
//   }, []);

//   const features = [
//     {
//       icon: <FileText className="w-8 h-8" />,
//       title: "Smart Invoice Creation",
//       description:
//         "Create professional invoices in seconds with our AI-powered templates and automatic calculations.",
//     },
//     {
//       icon: <Clock className="w-8 h-8" />,
//       title: "Automated Reminders",
//       description:
//         "Never chase payments again. Automated follow-ups ensure you get paid on time, every time.",
//     },
//     {
//       icon: <BarChart3 className="w-8 h-8" />,
//       title: "Real-time Analytics",
//       description:
//         "Track your financial performance with detailed insights and customizable dashboards.",
//     },
//     {
//       icon: <Globe className="w-8 h-8" />,
//       title: "Multi-currency Support",
//       description:
//         "Work with clients globally. Support for 100+ currencies with real-time exchange rates.",
//     },
//     {
//       icon: <Shield className="w-8 h-8" />,
//       title: "Bank-level Security",
//       description:
//         "Your data is protected with 256-bit SSL encryption and SOC 2 Type II compliance.",
//     },
//     {
//       icon: <Zap className="w-8 h-8" />,
//       title: "Lightning Fast",
//       description:
//         "Optimized for speed. Create, send, and track invoices faster than ever before.",
//     },
//   ];

//   const testimonials = [
//     {
//       name: "Sarah Chen",
//       role: "Freelance Designer",
//       content:
//         "Invoxa transformed my billing process. I went from spending hours on invoices to just minutes.",
//       rating: 5,
//     },
//     {
//       name: "Michael Rodriguez",
//       role: "Agency Owner",
//       content:
//         "The automated reminders alone have improved our cash flow by 40%. Game changer!",
//       rating: 5,
//     },
//     {
//       name: "Emily Watson",
//       role: "Consultant",
//       content:
//         "Finally, an invoicing tool that actually understands what freelancers need. Love the simplicity.",
//       rating: 5,
//     },
//   ];

//   const pricingPlans = [
//     {
//       name: "Starter",
//       price: "$9",
//       period: "/month",
//       description: "Perfect for freelancers and small businesses",
//       features: [
//         "Up to 50 invoices/month",
//         "5 clients",
//         "Basic templates",
//         "Email support",
//         "Mobile app access",
//       ],
//       popular: false,
//     },
//     {
//       name: "Professional",
//       price: "$29",
//       period: "/month",
//       description: "For growing businesses and agencies",
//       features: [
//         "Unlimited invoices",
//         "Unlimited clients",
//         "Premium templates",
//         "Automated reminders",
//         "Advanced analytics",
//         "Priority support",
//         "API access",
//       ],
//       popular: true,
//     },
//     {
//       name: "Enterprise",
//       price: "$99",
//       period: "/month",
//       description: "For large teams and organizations",
//       features: [
//         "Everything in Professional",
//         "Custom branding",
//         "Multi-user accounts",
//         "Advanced integrations",
//         "Dedicated account manager",
//         "Custom workflows",
//         "SLA guarantee",
//       ],
//       popular: false,
//     },
//   ];

//   return (
//     <>
//       <div className="min-h-screen bg-gray-900 text-white">
//         {/* Navigation */}
//         <nav
//           className={`fixed w-full z-50 transition-all duration-300 ${
//             scrollY > 50 ? "bg-gray-900/95 backdrop-blur-sm" : "bg-transparent"
//           }`}
//         >
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between items-center py-4">
//               <div className="flex items-center space-x-2">
//                 <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
//                   <FileText className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-xl font-bold">Invoxa</span>
//               </div>

//               <div className="hidden md:flex items-center space-x-8">
//                 <a
//                   href="#features"
//                   className="hover:text-blue-400 transition-colors"
//                 >
//                   Features
//                 </a>
//                 <a
//                   href="#pricing"
//                   className="hover:text-blue-400 transition-colors"
//                 >
//                   Pricing
//                 </a>
//                 <a
//                   href="#testimonials"
//                   className="hover:text-blue-400 transition-colors"
//                 >
//                   Reviews
//                 </a>
//                 <a
//                   href="#contact"
//                   className="hover:text-blue-400 transition-colors"
//                 >
//                   Contact
//                 </a>
//                 <SignedIn>
//                   <UserButton />
//                 </SignedIn>
//                 <SignedOut>
//                   <SignInButton>
//                     <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
//                       Sign In
//                     </button>
//                   </SignInButton>
//                 </SignedOut>
//               </div>

//               <button
//                 className="md:hidden"
//                 onClick={() => setIsMenuOpen(!isMenuOpen)}
//               >
//                 {isMenuOpen ? (
//                   <X className="w-6 h-6" />
//                 ) : (
//                   <Menu className="w-6 h-6" />
//                 )}
//               </button>
//             </div>

//             {/* Mobile Menu */}
//             {isMenuOpen && (
//               <div className="md:hidden bg-gray-800 rounded-lg mt-2 p-4 animate-in slide-in-from-top-2">
//                 <div className="flex flex-col space-y-4">
//                   <a
//                     href="#features"
//                     className="hover:text-blue-400 transition-colors"
//                   >
//                     Features
//                   </a>
//                   <a
//                     href="#pricing"
//                     className="hover:text-blue-400 transition-colors"
//                   >
//                     Pricing
//                   </a>
//                   <a
//                     href="#testimonials"
//                     className="hover:text-blue-400 transition-colors"
//                   >
//                     Reviews
//                   </a>
//                   <a
//                     href="#contact"
//                     className="hover:text-blue-400 transition-colors"
//                   >
//                     Contact
//                   </a>
//                   <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors w-full">
//                     Sign In
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </nav>

//         {/* Hero Section */}
//         <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
//           <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
//           <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>

//           <div className="max-w-4xl mx-auto text-center relative z-10">
//             <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
//               <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
//                 Invoice Like a Pro
//               </h1>
//               <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
//                 Streamline your billing process with AI-powered invoicing. Get
//                 paid faster, track everything, and focus on what matters.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//                 <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 group">
//                   Start Free Trial
//                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//                 </button>
//                 <button className="border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:bg-gray-800">
//                   Watch Demo
//                 </button>
//               </div>
//               <p className="text-gray-400 mt-6 text-sm">
//                 No credit card required • 14-day free trial
//               </p>
//             </div>
//           </div>

//           <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
//             <ChevronDown className="w-6 h-6 text-gray-400" />
//           </div>
//         </section>

//         {/* Stats Section */}
//         <section className="py-20 bg-gray-800/50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
//                 <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
//                   50K+
//                 </div>
//                 <div className="text-gray-300">Happy Users</div>
//               </div>
//               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
//                 <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
//                   $2M+
//                 </div>
//                 <div className="text-gray-300">Invoices Sent</div>
//               </div>
//               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
//                 <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
//                   99.9%
//                 </div>
//                 <div className="text-gray-300">Uptime</div>
//               </div>
//               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
//                 <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
//                   4.9★
//                 </div>
//                 <div className="text-gray-300">User Rating</div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Features Section */}
//         <section id="features" className="py-20">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center mb-16">
//               <h2 className="text-3xl md:text-5xl font-bold mb-6">
//                 Everything You Need
//               </h2>
//               <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//                 Powerful features designed to make invoicing effortless and
//                 efficient
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {features.map((feature, index) => (
//                 <div
//                   key={index}
//                   className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 group"
//                 >
//                   <div className="text-blue-400 mb-4 group-hover:text-purple-400 transition-colors duration-300">
//                     {feature.icon}
//                   </div>
//                   <h3 className="text-xl font-semibold mb-3">
//                     {feature.title}
//                   </h3>
//                   <p className="text-gray-300 leading-relaxed">
//                     {feature.description}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* Testimonials Section */}
//         <section id="testimonials" className="py-20 bg-gray-800/50">
//           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//             <h2 className="text-3xl md:text-5xl font-bold mb-16">
//               Loved by Thousands
//             </h2>

//             <div className="relative h-64">
//               {testimonials.map((testimonial, index) => (
//                 <div
//                   key={index}
//                   className={`absolute inset-0 transition-all duration-500 ${
//                     index === currentTestimonial
//                       ? "opacity-100 transform translate-x-0"
//                       : "opacity-0 transform translate-x-8"
//                   }`}
//                 >
//                   <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
//                     <div className="flex justify-center mb-4">
//                       {[...Array(testimonial.rating)].map((_, i) => (
//                         <Star
//                           key={i}
//                           className="w-5 h-5 text-yellow-400 fill-current"
//                         />
//                       ))}
//                     </div>
//                     <p className="text-xl text-gray-200 mb-6 italic">
//                       "{testimonial.content}"
//                     </p>
//                     <div>
//                       <p className="font-semibold">{testimonial.name}</p>
//                       <p className="text-gray-400">{testimonial.role}</p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="flex justify-center space-x-2 mt-8">
//               {testimonials.map((_, index) => (
//                 <button
//                   key={index}
//                   onClick={() => setCurrentTestimonial(index)}
//                   className={`w-3 h-3 rounded-full transition-all ${
//                     index === currentTestimonial ? "bg-blue-500" : "bg-gray-600"
//                   }`}
//                 />
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* Pricing Section */}
//         <section id="pricing" className="py-20">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center mb-16">
//               <h2 className="text-3xl md:text-5xl font-bold mb-6">
//                 Simple, Transparent Pricing
//               </h2>
//               <p className="text-xl text-gray-300 max-w-2xl mx-auto">
//                 Choose the plan that fits your business needs
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//               {pricingPlans.map((plan, index) => (
//                 <div
//                   key={index}
//                   className={`relative bg-gray-800 p-8 rounded-xl border transition-all duration-300 hover:transform hover:scale-105 ${
//                     plan.popular
//                       ? "border-blue-500 ring-2 ring-blue-500/20"
//                       : "border-gray-700 hover:border-gray-600"
//                   }`}
//                 >
//                   {plan.popular && (
//                     <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 rounded-full text-sm font-semibold">
//                       Most Popular
//                     </div>
//                   )}

//                   <div className="text-center mb-8">
//                     <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
//                     <p className="text-gray-400 mb-4">{plan.description}</p>
//                     <div className="flex items-baseline justify-center">
//                       <span className="text-4xl font-bold">{plan.price}</span>
//                       <span className="text-gray-400 ml-1">{plan.period}</span>
//                     </div>
//                   </div>

//                   <ul className="space-y-3 mb-8">
//                     {plan.features.map((feature, featureIndex) => (
//                       <li key={featureIndex} className="flex items-center">
//                         <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
//                         <span className="text-gray-300">{feature}</span>
//                       </li>
//                     ))}
//                   </ul>

//                   <button
//                     className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
//                       plan.popular
//                         ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
//                         : "bg-gray-700 hover:bg-gray-600 text-white"
//                     }`}
//                   >
//                     Get Started
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* CTA Section */}
//         <section className="py-20 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
//           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//             <h2 className="text-3xl md:text-5xl font-bold mb-6">
//               Ready to Get Started?
//             </h2>
//             <p className="text-xl text-gray-300 mb-8">
//               Join thousands of businesses already using Invoxa
//             </p>
//             <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
//               Start Your Free Trial
//             </button>
//           </div>
//         </section>

//         {/* Footer */}
//         <footer id="contact" className="bg-gray-900 border-t border-gray-800">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//               <div>
//                 <div className="flex items-center space-x-2 mb-4">
//                   <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
//                     <FileText className="w-5 h-5 text-white" />
//                   </div>
//                   <span className="text-xl font-bold">Invoxa</span>
//                 </div>
//                 <p className="text-gray-400">
//                   The modern way to handle invoicing for your business.
//                 </p>
//               </div>

//               <div>
//                 <h3 className="font-semibold mb-4">Product</h3>
//                 <ul className="space-y-2 text-gray-400">
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       Features
//                     </a>
//                   </li>
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       Pricing
//                     </a>
//                   </li>
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       API
//                     </a>
//                   </li>
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       Integrations
//                     </a>
//                   </li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="font-semibold mb-4">Company</h3>
//                 <ul className="space-y-2 text-gray-400">
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       About
//                     </a>
//                   </li>
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       Blog
//                     </a>
//                   </li>
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       Careers
//                     </a>
//                   </li>
//                   <li>
//                     <a href="#" className="hover:text-white transition-colors">
//                       Contact
//                     </a>
//                   </li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="font-semibold mb-4">Contact Info</h3>
//                 <ul className="space-y-2 text-gray-400">
//                   <li className="flex items-center">
//                     <Mail className="w-4 h-4 mr-2" />
//                     hello@Invoxa.com
//                   </li>
//                   <li className="flex items-center">
//                     <Phone className="w-4 h-4 mr-2" />
//                     +1 (555) 123-4567
//                   </li>
//                   <li className="flex items-center">
//                     <MapPin className="w-4 h-4 mr-2" />
//                     San Francisco, CA
//                   </li>
//                 </ul>
//               </div>
//             </div>

//             <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
//               <p>&copy; 2025 Invoxa. All rights reserved.</p>
//             </div>
//           </div>
//         </footer>
//       </div>
//     </>
//   );
// };

// export default InvoiceProLanding;



import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Showcase from './components/Showcase';
import Team from './components/Team';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';

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
          
          <div className="relative">
            <div className="lighting-glow bg-indigo-500/10 w-[500px] h-[500px] top-0 left-0"></div>
            <Features />
          </div>

          <div className="relative bg-slate-950">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-950 to-transparent"></div>
            <Showcase />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
          </div>

          <Team />

          <div className="relative">
            <div className="lighting-glow bg-purple-500/5 w-[400px] h-[400px] bottom-0 right-0"></div>
            <Testimonials />
          </div>

          <Pricing />

          {/* Final CTA with specific highlight */}
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
                    Elevate your business billing to professional standards. Join thousands of high-performing teams today.
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
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
