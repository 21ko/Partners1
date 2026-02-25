import { Builder, AuthResponse, Session } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authService = {
    async register(username: string, password: string, github_username: string): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, github_username })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const data: AuthResponse = await res.json();
        this.saveSession(data);
        return data;
    },

    async login(username: string, password: string): Promise<AuthResponse> {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data: AuthResponse = await res.json();
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

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Update failed');
        }

        const data = await res.json();

        // Update session in localStorage
        session.profile = data.profile;
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
    }
};
