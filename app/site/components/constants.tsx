
import React from 'react';
import { 
  FileText, 
  Clock, 
  BarChart3, 
  Globe, 
  Shield, 
  Zap,
  Layout,
  PieChart,
  Smartphone
} from 'lucide-react';
import { Feature, Testimonial, PricingPlan, TeamMember, PortfolioItem } from './types';

export const FEATURES: Feature[] = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: "AI Smart Invoicing",
    description: "Our machine learning engine predicts tax categories and suggests optimal payment terms for every client."
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Zero-Latency Reminders",
    description: "Polite, automated follow-ups that handle the awkwardness of late payments for you."
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Quantum Analytics",
    description: "Real-time cash flow forecasting that helps you plan for next month and next year."
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Compliance",
    description: "Support for 180+ countries with local VAT/GST rules automatically applied to every invoice."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Military-Grade Security",
    description: "Your financial data is protected by end-to-end encryption and SOC2 Type II compliance standards."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "One-Click Payments",
    description: "Integrated Stripe, PayPal, and Apple Pay so your clients can pay you as soon as they see the bill."
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Dr. Alistair Vance",
    role: "CEO at FintechFlow",
    avatar: "https://picsum.photos/seed/user1/100/100",
    content: "Invoxa has completely redefined how we manage our accounts receivable. The automation is flawless.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Creative Director",
    avatar: "https://picsum.photos/seed/user2/100/100",
    content: "The interface is beautiful and intuitive. I actually look forward to billing my clients now!",
    rating: 5
  },
  {
    name: "Jameson Clarke",
    role: "Freelance Architect",
    avatar: "https://picsum.photos/seed/user3/100/100",
    content: "The multi-currency support is a lifesaver for my international projects. Truly professional.",
    rating: 5
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Freelance",
    price: "$12",
    period: "/mo",
    description: "Ideal for solo creators and independent professionals.",
    features: [
      "Up to 25 Monthly Invoices",
      "Unlimited Clients",
      "Basic Tax Reporting",
      "Direct Bank Transfers",
      "Mobile App Access"
    ],
    popular: false
  },
  {
    name: "Pro Agency",
    price: "$39",
    period: "/mo",
    description: "The gold standard for growing teams and boutique agencies.",
    features: [
      "Unlimited Everything",
      "AI Smart Reminders",
      "Priority API Access",
      "Team Collaboration (5 seats)",
      "Custom Branding & Domains"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/mo",
    description: "Custom solutions for large-scale operations and corporations.",
    features: [
      "SSO & SAML Integration",
      "Dedicated Success Manager",
      "Custom Contract Support",
      "White-label Dashboard",
      "Volume-based Discounts"
    ],
    popular: false
  }
];

export const TEAM: TeamMember[] = [
  {
    name: "Julian Sterling",
    role: "Founder & CEO",
    image: "https://picsum.photos/seed/exec1/400/400",
    bio: "Ex-Fintech Lead with 15 years of experience in payment processing architecture."
  },
  {
    name: "Sarah Jenkins",
    role: "Head of Product",
    image: "https://picsum.photos/seed/exec2/400/400",
    bio: "Passionate about user-centric design and streamlining complex financial workflows."
  },
  {
    name: "Marcus Thorne",
    role: "Chief Technology Officer",
    image: "https://picsum.photos/seed/exec3/400/400",
    bio: "A cryptography expert dedicated to making financial data the most secure asset on the web."
  }
];

export const PORTFOLIO: PortfolioItem[] = [
  {
    title: "Modern Dashboard",
    category: "User Experience",
    image: "https://picsum.photos/seed/dashboard/800/600",
    description: "A centralized hub for all your financial movements, featuring real-time data streaming."
  },
  {
    title: "Invoice Designer",
    category: "Interface",
    image: "https://picsum.photos/seed/builder/800/600",
    description: "Drag-and-drop builder for creating pixel-perfect, branded invoices in seconds."
  },
  {
    title: "Mobile Workflow",
    category: "Platform",
    image: "https://picsum.photos/seed/mobile/800/600",
    description: "Fully responsive mobile experience ensuring you can bill from anywhere in the world."
  }
];
