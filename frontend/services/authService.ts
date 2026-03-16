import { Builder, AuthResponse, Session } from '../types';

export const API_URL = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? 'https://partners1-production.up.railway.app'
    : (((import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000');

export const safeJson = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await res.json();
    }
    const text = await res.text();
    if (text.includes('<!DOCTYPE html>') || text.includes('The page could not be found')) {
        throw new Error(`API Endpoint not found (404). Check if backend is running at ${API_URL}`);
    }
    throw new Error(`Server error (${res.status}): ${text.slice(0, 50)}`);
};

export const authService = {
    async register(username: string, password: string, github_username: string, email?: string, city?: string): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, github_username, email, city })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await safeJson(res);
        this.saveSession(data);
        return data;
    },

    async login(username: string, password: string): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await safeJson(res);
        this.saveSession(data);
        return data;
    },

    async updateProfile(updates: any): Promise<any> {
        const session = this.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(`${API_URL}/profile/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: session.session_id, ...updates })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await safeJson(res);

        session.profile = data.profile;
        session.needs_onboarding = false;
        this.saveSession(session);
        return data;
    },

    saveSession(session: any): void {
        localStorage.setItem('partners_session', JSON.stringify(session));
    },

    getSession(): Session | null {
        const data = localStorage.getItem('partners_session');
        if (!data) return null;
        try {
            return JSON.parse(data) as Session;
        } catch {
            return null;
        }
    },

    clearSession(): void {
        localStorage.removeItem('partners_session');
    },

    isAuthenticated(): boolean {
        return !!this.getSession();
    },

    async getCommunities(): Promise<any[]> {
        const res = await fetch(`${API_URL}/communities`);
        if (!res.ok) throw new Error(await res.text());
        return await safeJson(res);
    },

    async getCommunityMembers(communityId: string): Promise<any> {
        const res = await fetch(`${API_URL}/communities/${communityId}/members`);
        if (!res.ok) throw new Error(await res.text());
        return await safeJson(res);
    },

    async joinCommunity(communityId: string): Promise<any> {
        const session = this.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(`${API_URL}/communities/${communityId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: session.session_id })
        });
        if (!res.ok) throw new Error(await res.text());
        return await safeJson(res);
    }
};