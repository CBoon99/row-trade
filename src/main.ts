// Row-Trader: Safe Trading Platform for Kids
// Main entry point - initializes trading platform only

import { EnhancedTradingUI } from './ui/EnhancedTradingUI';
import { FriendsListUI } from './ui/FriendsListUI';
import { OnboardingUI } from './ui/OnboardingUI';
import { AuthUI } from './ui/AuthUI';
import { authManager } from './systems/AuthManager';
import { useTradingStoreExtended } from './stores/TradingStoreExtended';
import { useTradingStoreWithAPI } from './stores/TradingStoreWithAPI';

// Initialize Row-Trader when DOM is ready
const initRowTrader = async () => {
    const loadingEl = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    
    try {
        if (loadingMessage) {
            loadingMessage.textContent = 'Initializing Row-Trader...';
        }
        
        console.log('🚀 Starting Row-Trader initialization...');
        
        // Initialize UI components
        if (loadingMessage) {
            loadingMessage.textContent = 'Loading trading hub...';
        }
        
        const enhancedTradingUI = new EnhancedTradingUI('trading-container');
        const friendsListUI = new FriendsListUI('friends-container');
        const onboardingUI = new OnboardingUI('onboarding-container');
        const authUI = new AuthUI('auth-container');
        
        // Make globally accessible for debugging
        (window as any).enhancedTradingUI = enhancedTradingUI;
        (window as any).friendsListUI = friendsListUI;
        (window as any).onboardingUI = onboardingUI;
        (window as any).authUI = authUI;
        
        console.log('✅ UI components initialized');
        
        // Initialize authentication
        if (loadingMessage) {
            loadingMessage.textContent = 'Setting up authentication...';
        }
        
        authManager.onAuthChange(async (user) => {
            if (!user) {
                // Not logged in - show auth UI
                authUI.showLoginRequired();
                enhancedTradingUI.hide();
                friendsListUI.hide();
                onboardingUI.hide();
            } else {
                // Logged in - hide auth UI
                authUI.hide();
                
                // Sync data from API
                const apiStore = useTradingStoreWithAPI.getState();
                try {
                    if (loadingMessage) {
                        loadingMessage.textContent = 'Syncing your data...';
                    }
                    
                    await apiStore.syncListings();
                    await apiStore.syncFriends();
                    await apiStore.syncUserData();
                } catch (error) {
                    console.error('Error syncing data:', error);
                }
                
                // Check if onboarding needed
                const store = useTradingStoreExtended.getState();
                if (onboardingUI.needsOnboarding()) {
                    onboardingUI.show();
                } else {
                    enhancedTradingUI.showEnhancedHub();
                }
                
                store.updateExpertStatus();
            }
            
            // Hide loading screen
            if (loadingEl) {
                loadingEl.classList.add('hidden');
            }
        });
        
        // Check initial auth state
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            authUI.showLoginRequired();
            if (loadingEl) {
                loadingEl.classList.add('hidden');
            }
        }
        
        console.log('✅ Row-Trader initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Row-Trader:', error);
        if (loadingMessage) {
            loadingMessage.textContent = 'Failed to load. Please refresh the page.';
            loadingMessage.style.color = '#ff4444';
        }
    }
};

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRowTrader);
} else {
    initRowTrader();
}
