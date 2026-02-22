import { useTradingStore, User, Listing, Offer, Game } from '../stores/TradingStore';
import { getSharedGames, generateTradeSuggestion, generateOfferTemplate } from '../utils/matching';

export class TradingUI {
    private container: HTMLElement;
    private store = useTradingStore;
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
        this.init();
    }
    
    private init(): void {
        // Load from localStorage
        this.loadFromStorage();
        
        // Create default user if none exists
        if (!this.store.getState().currentUser) {
            const defaultUser: User = {
                id: 'user-' + Date.now(),
                username: 'Explorer',
                favoriteGames: ['rowblocks'],
            };
            this.store.setCurrentUser(defaultUser);
        }
    }
    
    private loadFromStorage(): void {
        try {
            const userStr = localStorage.getItem('row-trader-user');
            if (userStr) {
                const user = JSON.parse(userStr);
                this.store.getState().setCurrentUser(user);
            }
            
            const listingsStr = localStorage.getItem('row-trader-listings');
            if (listingsStr) {
                const listings = JSON.parse(listingsStr);
                this.store.setState({ listings });
            }
            
            const offersStr = localStorage.getItem('row-trader-offers');
            if (offersStr) {
                const offers = JSON.parse(offersStr);
                this.store.setState({ offers });
            }
            
            const messagesStr = localStorage.getItem('row-trader-messages');
            if (messagesStr) {
                const messages = JSON.parse(messagesStr);
                this.store.setState({ messages });
            }
        } catch (e) {
            console.error('Failed to load from storage:', e);
        }
    }
    
    /**
     * Show main trading hub
     */
    showTradingHub(): void {
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="trading-hub">
                <div class="hub-header">
                    <h1>🌊 Row-Trader</h1>
                    <p class="subtitle">Safe Trading Hub for Rowblocks & Gamers</p>
                </div>
                
                <div class="hub-actions">
                    <button class="action-btn swap-btn" onclick="tradingUI.showBrowse()">
                        <span class="action-icon">↔️</span>
                        <span class="action-title">Swap It</span>
                        <span class="action-desc">Swap your Abyssal Block for a Friend's</span>
                    </button>
                    
                    <button class="action-btn trade-btn" onclick="tradingUI.showBrowse()">
                        <span class="action-icon">⇄</span>
                        <span class="action-title">Trade It</span>
                        <span class="action-desc">Trade Rowblocks Fish for Animal Crossing Glam</span>
                    </button>
                    
                    <button class="action-btn gift-btn" onclick="tradingUI.showCreateListing()">
                        <span class="action-icon">🎁</span>
                        <span class="action-title">Gift It</span>
                        <span class="action-desc">Gift a Gem or Rare Fish to a Buddy</span>
                    </button>
                </div>
                
                <div class="hub-nav">
                    <button onclick="tradingUI.showBrowse()">Browse Listings</button>
                    <button onclick="tradingUI.showMyListings()">My Listings</button>
                    <button onclick="tradingUI.showMyOffers()">My Offers</button>
                    <button onclick="tradingUI.showProfile()">Profile</button>
                    <button onclick="tradingUI.showMessages()">Messages</button>
                </div>
                
                <div class="safety-reminder">
                    <h3>🛡️ Safety First!</h3>
                    <ul>
                        <li>✅ All negotiations stay in-app — no external links</li>
                        <li>✅ No personal info sharing (emails, addresses, passwords)</li>
                        <li>✅ Report any suspicious behavior</li>
                        <li>💡 <strong>Bartering Tip:</strong> Start with "What do you offer?" — it's like haggling at a market!</li>
                    </ul>
                </div>
            </div>
        `;
        
        this.injectStyles();
    }
    
    /**
     * Show browse listings page
     */
    showBrowse(): void {
        this.container.style.display = 'block';
        const listings = this.store.getState().listings.filter(l => l.status === 'active');
        const currentUser = this.store.getState().currentUser!;
        
        let listingsHTML = '';
        if (listings.length === 0) {
            listingsHTML = '<p class="empty-state">No listings yet. Be the first to create one!</p>';
        } else {
            listingsHTML = listings.map(listing => {
                // Get shared games (simplified - would need user lookup in real app)
                const sharedGames: Game[] = []; // Placeholder
                const matchScore = sharedGames.length;
                const matchBadge = matchScore > 0 
                    ? `<span class="match-badge">${matchScore} shared game${matchScore > 1 ? 's' : ''}</span>`
                    : '';
                
                return `
                    <div class="listing-card">
                        <div class="listing-header">
                            <h3>${listing.itemName}</h3>
                            ${matchBadge}
                        </div>
                        <p class="listing-game">From: ${this.getGameName(listing.gameId)}</p>
                        <p class="listing-desc">${listing.itemDescription}</p>
                        <p class="listing-wants"><strong>Wants:</strong> ${listing.wants}</p>
                        <button class="btn-primary" onclick="tradingUI.showMakeOffer('${listing.id}')">
                            Make Offer
                        </button>
                    </div>
                `;
            }).join('');
        }
        
        this.container.innerHTML = `
            <div class="browse-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showTradingHub()">← Back</button>
                    <h2>Browse Listings</h2>
                </div>
                <div class="listings-grid">
                    ${listingsHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Show make offer form
     */
    showMakeOffer(listingId: string): void {
        this.container.style.display = 'block';
        const listing = this.store.getState().listings.find(l => l.id === listingId);
        if (!listing) return;
        
        const currentUser = this.store.getState().currentUser!;
        const template = generateOfferTemplate(
            currentUser,
            { id: listing.userId, username: '', favoriteGames: [] } as User,
            this.store.getState().availableGames
        );
        
        this.container.innerHTML = `
            <div class="offer-form-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showBrowse()">← Back</button>
                    <h2>Make Offer</h2>
                </div>
                
                <div class="listing-preview">
                    <h3>${listing.itemName}</h3>
                    <p>${listing.itemDescription}</p>
                    <p><strong>Wants:</strong> ${listing.wants}</p>
                </div>
                
                <form class="offer-form" onsubmit="tradingUI.submitOffer(event, '${listingId}')">
                    <div class="form-group">
                        <label>What I'm Offering:</label>
                        <input type="text" name="offering" value="${template.offering}" required
                               placeholder="My Rowblocks Abyssal Gem">
                        <small class="tip">💡 Bartering Tip: Start with a fair offer, then negotiate!</small>
                    </div>
                    
                    <div class="form-group">
                        <label>What I Want:</label>
                        <input type="text" name="wanting" value="${template.wanting}" required
                               placeholder="Your Animal Crossing Star Fragment">
                    </div>
                    
                    <div class="form-group">
                        <label>Additional Notes (optional):</label>
                        <textarea name="notes" placeholder="I'll add a fish if you add a gem!"></textarea>
                        <small class="tip">💡 Negotiation Fun: Try "I'll add X if you add Y" — it's how real traders do it!</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Send Offer</button>
                        <button type="button" class="btn-secondary" onclick="tradingUI.showBrowse()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    /**
     * Submit offer
     */
    submitOffer(event: Event, listingId: string): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const listing = this.store.getState().listings.find(l => l.id === listingId);
        if (!listing) return;
        
        const currentUser = this.store.getState().currentUser!;
        
        this.store.getState().makeOffer({
            listingId,
            fromUserId: currentUser.id,
            toUserId: listing.userId,
            offering: formData.get('offering') as string,
            wanting: formData.get('wanting') as string,
        });
        
        alert('✅ Offer sent! Check Messages for responses.');
        this.showBrowse();
    }
    
    /**
     * Show profile page
     */
    showProfile(): void {
        this.container.style.display = 'block';
        const currentUser = this.store.getState().currentUser!;
        const selectedGames = currentUser.favoriteGames || [];
        
        this.container.innerHTML = `
            <div class="profile-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showTradingHub()">← Back</button>
                    <h2>My Profile</h2>
                </div>
                
                <div class="profile-section">
                    <label>Username:</label>
                    <input type="text" id="profile-username" value="${currentUser.username}">
                </div>
                
                <div class="profile-section">
                    <label>Favorite Games (select multiple):</label>
                    <div class="games-select">
                        ${this.store.availableGames.map(game => `
                            <label class="game-checkbox">
                                <input type="checkbox" value="${game.id}" 
                                       ${selectedGames.includes(game.id) ? 'checked' : ''}
                                       onchange="tradingUI.updateFavoriteGames()">
                                <span>${game.name}</span>
                            </label>
                        `).join('')}
                    </div>
                    <small>💡 Matching: You'll see shared games with other traders!</small>
                </div>
                
                <button class="btn-primary" onclick="tradingUI.saveProfile()">Save Profile</button>
            </div>
        `;
    }
    
    /**
     * Update favorite games
     */
    updateFavoriteGames(): void {
        const checkboxes = document.querySelectorAll('.game-checkbox input:checked') as NodeListOf<HTMLInputElement>;
        const selectedGames = Array.from(checkboxes).map(cb => cb.value);
        this.store.getState().updateFavoriteGames(selectedGames);
    }
    
    /**
     * Save profile
     */
    saveProfile(): void {
        const usernameInput = document.getElementById('profile-username') as HTMLInputElement;
        if (usernameInput) {
            const currentUser = this.store.getState().currentUser!;
            this.store.setCurrentUser({
                ...currentUser,
                username: usernameInput.value,
            });
        }
        alert('✅ Profile saved!');
        this.showProfile();
    }
    
    /**
     * Show my listings
     */
    showMyListings(): void {
        this.container.style.display = 'block';
        const listings = this.store.getState().myListings;
        
        let listingsHTML = '';
        if (listings.length === 0) {
            listingsHTML = '<p class="empty-state">You have no listings. Create one to start trading!</p>';
        } else {
            listingsHTML = listings.map(listing => `
                <div class="listing-card">
                    <h3>${listing.itemName}</h3>
                    <p>${listing.itemDescription}</p>
                    <p><strong>Wants:</strong> ${listing.wants}</p>
                    <p class="listing-status">Status: ${listing.status}</p>
                    <button class="btn-secondary" onclick="tradingUI.removeListing('${listing.id}')">Remove</button>
                </div>
            `).join('');
        }
        
        this.container.innerHTML = `
            <div class="my-listings-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showTradingHub()">← Back</button>
                    <h2>My Listings</h2>
                    <button class="btn-primary" onclick="tradingUI.showCreateListing()">+ Create Listing</button>
                </div>
                <div class="listings-grid">
                    ${listingsHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Show create listing form
     */
    showCreateListing(): void {
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="create-listing-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showMyListings()">← Back</button>
                    <h2>Create Listing</h2>
                </div>
                
                <form class="listing-form" onsubmit="tradingUI.submitListing(event)">
                    <div class="form-group">
                        <label>Game:</label>
                        <select name="gameId" required>
                            ${this.store.getState().availableGames.map(game => `
                                <option value="${game.id}">${game.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Item Name:</label>
                        <input type="text" name="itemName" required 
                               placeholder="Abyssal Gem">
                    </div>
                    
                    <div class="form-group">
                        <label>Item Description:</label>
                        <textarea name="itemDescription" required
                                  placeholder="A rare glowing gem from the deep abyss..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Item Type:</label>
                        <select name="itemType" required>
                            <option value="block">Block</option>
                            <option value="fish">Fish</option>
                            <option value="gem">Gem</option>
                            <option value="skin">Skin</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>What I Want:</label>
                        <input type="text" name="wants" required
                               placeholder="Animal Crossing Star Fragment">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Create Listing</button>
                        <button type="button" class="btn-secondary" onclick="tradingUI.showMyListings()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    /**
     * Submit listing
     */
    submitListing(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const currentUser = this.store.getState().currentUser!;
        
        this.store.getState().addListing({
            userId: currentUser.id,
            gameId: formData.get('gameId') as string,
            itemName: formData.get('itemName') as string,
            itemDescription: formData.get('itemDescription') as string,
            itemType: formData.get('itemType') as 'block' | 'fish' | 'gem' | 'skin' | 'other',
            wants: formData.get('wants') as string,
        });
        
        alert('✅ Listing created!');
        this.showMyListings();
    }
    
    /**
     * Remove listing
     */
    removeListing(listingId: string): void {
        if (confirm('Remove this listing?')) {
            this.store.getState().removeListing(listingId);
            this.showMyListings();
        }
    }
    
    /**
     * Show my offers
     */
    showMyOffers(): void {
        this.container.style.display = 'block';
        const offers = this.store.getState().myOffers;
        
        let offersHTML = '';
        if (offers.length === 0) {
            offersHTML = '<p class="empty-state">You have no offers yet.</p>';
        } else {
            offersHTML = offers.map(offer => {
                const listing = this.store.getState().listings.find(l => l.id === offer.listingId);
                return `
                    <div class="offer-card">
                        <h3>Offer for: ${listing?.itemName || 'Unknown'}</h3>
                        <p><strong>Offering:</strong> ${offer.offering}</p>
                        <p><strong>Wanting:</strong> ${offer.wanting}</p>
                        <p class="offer-status">Status: ${offer.status}</p>
                        ${offer.status === 'countered' && offer.counterOffer ? `
                            <div class="counter-offer">
                                <p><strong>Counter Offer:</strong></p>
                                <p>Offering: ${offer.counterOffer.offering}</p>
                                <p>Wanting: ${offer.counterOffer.wanting}</p>
                                <button class="btn-primary" onclick="tradingUI.acceptCounterOffer('${offer.counterOffer.id}')">Accept</button>
                                <button class="btn-secondary" onclick="tradingUI.counterCounterOffer('${offer.id}')">Counter Again</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
        
        this.container.innerHTML = `
            <div class="my-offers-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showTradingHub()">← Back</button>
                    <h2>My Offers</h2>
                </div>
                <div class="offers-list">
                    ${offersHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Show messages
     */
    showMessages(): void {
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="messages-page">
                <div class="page-header">
                    <button class="btn-back" onclick="tradingUI.showTradingHub()">← Back</button>
                    <h2>Messages</h2>
                </div>
                <p class="empty-state">Messages feature coming soon! Offers will appear here.</p>
            </div>
        `;
    }
    
    /**
     * Accept counter offer
     */
    acceptCounterOffer(offerId: string): void {
        this.store.getState().acceptOffer(offerId);
        alert('✅ Offer accepted! Trade complete!');
        this.showMyOffers();
    }
    
    /**
     * Counter a counter offer
     */
    counterCounterOffer(originalOfferId: string): void {
        const offer = this.store.getState().offers.find(o => o.id === originalOfferId);
        if (!offer || !offer.counterOffer) return;
        
        const newOffering = prompt('What are you offering?', offer.counterOffer.offering);
        const newWanting = prompt('What do you want?', offer.counterOffer.wanting);
        
        if (newOffering && newWanting) {
            this.store.getState().counterOffer(originalOfferId, newOffering, newWanting);
            this.showMyOffers();
        }
    }
    
    /**
     * Get game name by ID
     */
    private getGameName(gameId: string): string {
        const game = this.store.getState().availableGames.find(g => g.id === gameId);
        return game?.name || gameId;
    }
    
    /**
     * Inject trading UI styles
     */
    private injectStyles(): void {
        if (document.getElementById('trading-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'trading-ui-styles';
        style.textContent = `
            .trading-hub {
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .hub-header h1 {
                font-size: 3rem;
                margin: 0;
                background: linear-gradient(135deg, #001133, #6B46C1, #06B6D4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-align: center;
            }
            
            .subtitle {
                text-align: center;
                color: #88d0ff;
                font-size: 1.2rem;
                margin: 0.5rem 0 2rem;
            }
            
            .hub-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 2rem;
                margin: 2rem 0;
            }
            
            .action-btn {
                background: linear-gradient(135deg, #001133, #1a3a5a);
                border: 2px solid #06B6D4;
                border-radius: 15px;
                padding: 2rem;
                color: #fff;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-align: center;
            }
            
            .action-btn:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);
            }
            
            .action-icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 1rem;
            }
            
            .action-title {
                display: block;
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }
            
            .action-desc {
                display: block;
                font-size: 0.9rem;
                color: #88d0ff;
            }
            
            .hub-nav {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
                margin: 2rem 0;
            }
            
            .hub-nav button {
                background: #1a3a5a;
                border: 1px solid #06B6D4;
                color: #fff;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .hub-nav button:hover {
                background: #2a4a6a;
            }
            
            .safety-reminder {
                background: rgba(26, 58, 90, 0.5);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 1.5rem;
                margin-top: 2rem;
            }
            
            .safety-reminder h3 {
                margin-top: 0;
                color: #06B6D4;
            }
            
            .safety-reminder ul {
                list-style: none;
                padding: 0;
            }
            
            .safety-reminder li {
                margin: 0.5rem 0;
                color: #88d0ff;
            }
            
            .listings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
                margin: 2rem 0;
            }
            
            .listing-card {
                background: rgba(26, 58, 90, 0.7);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 1.5rem;
            }
            
            .listing-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .match-badge {
                background: #06B6D4;
                color: #001133;
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .btn-primary {
                background: #06B6D4;
                color: #001133;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.2s;
            }
            
            .btn-primary:hover {
                background: #08d4f4;
            }
            
            .btn-secondary {
                background: #1a3a5a;
                color: #fff;
                border: 1px solid #06B6D4;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .btn-secondary:hover {
                background: #2a4a6a;
            }
            
            .btn-back {
                background: transparent;
                border: 1px solid #06B6D4;
                color: #06B6D4;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
            }
            
            .form-group {
                margin-bottom: 1.5rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #88d0ff;
            }
            
            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                padding: 0.75rem;
                background: rgba(26, 58, 90, 0.7);
                border: 1px solid #06B6D4;
                border-radius: 6px;
                color: #fff;
                font-family: inherit;
            }
            
            .tip {
                display: block;
                margin-top: 0.5rem;
                color: #ffd700;
                font-size: 0.85rem;
            }
            
            .empty-state {
                text-align: center;
                color: #88d0ff;
                padding: 3rem;
            }
            
            .games-select {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .game-checkbox {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
            }
            
            .page-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 2rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Make tradingUI globally accessible
declare global {
    interface Window {
        tradingUI: TradingUI;
    }
}
