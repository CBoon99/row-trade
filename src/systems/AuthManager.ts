/**
 * Netlify Identity Authentication Manager
 * Handles login, signup, logout, password reset
 */

import netlifyIdentity from 'netlify-identity-widget';

export interface User {
    id: string;
    email: string;
    user_metadata?: {
        username?: string;
        role?: 'parent' | 'child';
        parent_email?: string;
    };
}

export class AuthManager {
    private currentUser: User | null = null;
    private listeners: Array<(user: User | null) => void> = [];

    constructor() {
        // Initialize Netlify Identity
        netlifyIdentity.init({
            APIUrl: window.location.origin,
        });

        // Listen for auth state changes
        netlifyIdentity.on('init', (user: any) => {
            this.currentUser = user ? this.transformUser(user) : null;
            this.notifyListeners();
        });

        netlifyIdentity.on('login', (user: any) => {
            this.currentUser = this.transformUser(user);
            this.notifyListeners();
            this.syncUserToDB();
        });

        netlifyIdentity.on('logout', () => {
            this.currentUser = null;
            this.notifyListeners();
        });

        netlifyIdentity.on('error', (err: any) => {
            console.error('Netlify Identity error:', err);
        });
    }

    /**
     * Transform Netlify Identity user to our User format
     */
    private transformUser(user: any): User {
        return {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata || {},
        };
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    /**
     * Open login modal
     */
    openLogin(): void {
        netlifyIdentity.open('login');
    }

    /**
     * Open signup modal
     */
    openSignup(): void {
        netlifyIdentity.open('signup');
    }

    /**
     * Open password recovery modal
     */
    openRecovery(): void {
        netlifyIdentity.open('recover');
    }

    /**
     * Logout
     */
    logout(): void {
        netlifyIdentity.logout();
    }

    /**
     * Close modal
     */
    close(): void {
        netlifyIdentity.close();
    }

    /**
     * Subscribe to auth state changes
     */
    onAuthChange(callback: (user: User | null) => void): () => void {
        this.listeners.push(callback);
        // Call immediately with current state
        callback(this.currentUser);
        
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Sync user to database after login
     */
    private async syncUserToDB(): Promise<void> {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/.netlify/functions/api-create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    email: this.currentUser.email,
                    username: this.currentUser.user_metadata?.username || this.currentUser.email.split('@')[0],
                    role: this.currentUser.user_metadata?.role || 'child',
                    parentEmail: this.currentUser.user_metadata?.parent_email,
                }),
            });

            if (!response.ok) {
                console.error('Failed to sync user to DB:', await response.text());
            }
        } catch (error) {
            console.error('Error syncing user to DB:', error);
        }
    }

    /**
     * Get auth token for API calls
     */
    getToken(): string | null {
        const user = netlifyIdentity.currentUser();
        return user?.token?.access_token || null;
    }
}

export const authManager = new AuthManager();
