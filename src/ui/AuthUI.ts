/**
 * Authentication UI Component
 * Login, signup, password recovery
 */

import { authManager, AuthManager } from '../systems/AuthManager';

export class AuthUI {
    private container: HTMLElement;
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Show login required screen
     */
    showLoginRequired(): void {
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="auth-screen">
                <div class="auth-content">
                    <h1>🌊 Welcome to Row-Trader!</h1>
                    <p class="subtitle">Please sign in to start trading</p>
                    
                    <div class="auth-buttons">
                        <button class="btn-primary btn-large" onclick="authUI.showLogin()">
                            Sign In
                        </button>
                        <button class="btn-secondary btn-large" onclick="authUI.showSignup()">
                            Sign Up
                        </button>
                    </div>
                    
                    <div class="auth-info">
                        <h3>🛡️ Safe Trading for Gamers</h3>
                        <ul>
                            <li>✅ Secure authentication</li>
                            <li>✅ Parental controls available</li>
                            <li>✅ Learn negotiation skills</li>
                            <li>✅ Trade items from your favorite games</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        this.injectStyles();
    }
    
    /**
     * Show login
     */
    showLogin(): void {
        authManager.openLogin();
    }
    
    /**
     * Show signup
     */
    showSignup(): void {
        authManager.openSignup();
    }
    
    /**
     * Show password recovery
     */
    showRecovery(): void {
        authManager.openRecovery();
    }
    
    /**
     * Hide auth UI
     */
    hide(): void {
        this.container.style.display = 'none';
    }
    
    /**
     * Inject styles
     */
    private injectStyles(): void {
        if (document.getElementById('auth-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'auth-ui-styles';
        style.textContent = `
            .auth-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 10, 30, 0.98);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                color: #fff;
            }
            
            .auth-content {
                max-width: 600px;
                padding: 3rem;
                text-align: center;
            }
            
            .auth-content h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #001133, #6B46C1, #06B6D4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .auth-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin: 2rem 0;
            }
            
            .btn-large {
                padding: 1.5rem 3rem;
                font-size: 1.2rem;
            }
            
            .auth-info {
                text-align: left;
                background: rgba(26, 58, 90, 0.5);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 2rem;
                margin-top: 2rem;
            }
            
            .auth-info ul {
                list-style: none;
                padding: 0;
            }
            
            .auth-info li {
                margin: 0.5rem 0;
                padding-left: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Make globally accessible
declare global {
    interface Window {
        authUI: AuthUI;
    }
}
