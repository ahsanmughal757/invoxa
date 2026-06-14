
import { ReactNode } from 'react';

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export interface PortfolioItem {
  title: string;
  category: string;
  image: string;
  description: string;
}
