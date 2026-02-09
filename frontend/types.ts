
export interface Link {
  platform: 'GitHub' | 'Twitter' | 'LinkedIn' | 'Portfolio' | 'Other';
  url: string;
}

export interface PastProject {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface Builder {
  id: string;
  name: string;
  avatar: string;
  role: string;
  skills: string[];
  bio: string;
  projectsCount: number;
  location: string;
  availability: 'Looking for Team' | 'Solo Building' | 'Just Browsing';
  links: Link[];
  pastProjectsList: PastProject[];
  lookingFor: string[]; // e.g., ["Co-founder", "Backend Developer", "Product Designer"]
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  ownerId: string;
  stars: number;
  image: string;
}

export interface Hackathon {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  prize: string;
}


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Synergy Engine Types
export interface SynergyHackathon {
  name: string;
  date: string;
  location: string;
  reasoning: string;
}

export interface MatchResult {
  compatibility_score: number;
  synergy_analysis: string;
  hackathons: SynergyHackathon[];
}

export interface IntegratedMatchResult {
  result: MatchResult;
  thoughts: string;
}
