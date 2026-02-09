
import { Builder, MatchResult, IntegratedMatchResult } from "../types";

const API_URL = 'http://localhost:8000';

export const getMatchAnalysis = async (userProfile: Builder, targetProfile: Builder): Promise<IntegratedMatchResult> => {
  try {
    const response = await fetch(`${API_URL}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bio1: `Role: ${userProfile.role}\nSkills: ${userProfile.skills.join(', ')}\nBio: ${userProfile.bio}`,
        bio2: `Role: ${targetProfile.role}\nSkills: ${targetProfile.skills.join(', ')}\nBio: ${targetProfile.bio}`
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as IntegratedMatchResult;
  } catch (error) {
    console.error("Failed to fetch match analysis:", error);
    throw error;
  }
};

export const generateBio = async (githubUrl: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/generate-bio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ github_url: githubUrl }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bio;
  } catch (error) {
    console.error("Failed to generate bio:", error);
    throw error;
  }
};

export const updateBio = async (sessionId: string, newBio: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/update-bio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId, bio: newBio }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Failed to update bio:", error);
    throw error;
  }
};

export const getProjectIdea = async (skills: string[]) => {
  console.warn("getProjectIdea is deprecated in favor of backend Synergy Engine.");
  return [];
};
