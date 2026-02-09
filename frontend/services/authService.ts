const API_BASE_URL = 'http://localhost:8000';

export interface RegisterRequest {
    username: string;
    password: string;
    bio: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    session_id: string;
    username: string;
    bio: string;
}

export const authService = {
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        return response.json();
    },

    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        return response.json();
    },

    async updateBio(bio: string): Promise<void> {
        const session_id = localStorage.getItem('session_id');

        if (!session_id) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/update-bio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id, bio }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update bio');
        }

        // Update localStorage
        localStorage.setItem('bio', bio);
    },

    saveSession(authData: AuthResponse): void {
        localStorage.setItem('session_id', authData.session_id);
        localStorage.setItem('username', authData.username);
        localStorage.setItem('bio', authData.bio);
    },

    getSession(): { session_id: string; username: string; bio: string } | null {
        const session_id = localStorage.getItem('session_id');
        const username = localStorage.getItem('username');
        const bio = localStorage.getItem('bio');

        if (session_id && username && bio) {
            return { session_id, username, bio };
        }

        return null;
    },

    clearSession(): void {
        localStorage.removeItem('session_id');
        localStorage.removeItem('username');
        localStorage.removeItem('bio');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('session_id');
    },
};
