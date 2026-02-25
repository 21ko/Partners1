export interface Builder {
  username: string;
  github_username: string;
  avatar: string;
  bio: string;
  building_style: 'ships_fast' | 'plans_first' | 'designs_first' | 'figures_it_out';
  interests: string[];
  open_to: string[];
  availability: 'this_weekend' | 'this_month' | 'open' | 'busy';
  current_idea?: string;
  city?: string;
  github_languages: string[];
  github_repos: GithubRepo[];
  total_stars: number;
  public_repos: number;
  learning: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  looking_for: 'mentor' | 'build_partner' | 'learning_buddy';
  created_at: string;
  updated_at: string;
}

export interface GithubRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
}

export interface MatchResult {
  matched_builder: Builder;
  chemistry_score: number;
  vibe: string;
  why: string;
  build_idea: string;
}

export interface Session {
  session_id: string;
  profile: Builder;
  needs_onboarding?: boolean;
}

export interface AuthResponse extends Session { }
