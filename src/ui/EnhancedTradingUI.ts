import { useTradingStoreExtended, EnhancedListing } from '../stores/TradingStoreExtended';
import { useTradingStoreWithAPI } from '../stores/TradingStoreWithAPI';
import { safetyModerator } from '../systems/SafetyModerator';

/**
 * Enhanced Trading UI with all final phase features
 * Extends base TradingUI with Rowbucks, reviews, expert status, etc.
 */
export class EnhancedTradingUI {
    private container: HTMLElement;
    private store = useTradingStoreExtended;
    private apiStore = useTradingStoreWithAPI;
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Show enhanced trading hub with Rowbucks, expert status, etc.
     */
    showEnhancedHub(): void {
        this.container.style.display = 'block';
        const expertStatus = this.store.getState().expertStatus;
        const rowbucks = this.store.getState().rowbucks;
        const tradeStreak = this.store.getState().tradeStreak;
        
        this.container.innerHTML = `
            <div class="enhanced-trading-hub">
                <div class="hub-header">
                    <h1>🌊 Row-Trader</h1>
                    <p class="subtitle">Safe Trading Hub for Rowblocks & Gamers</p>
                </div>
                
                <div class="status-bar">
                    <div class="rowbucks-display">
                        <span class="rowbucks-icon">💰</span>
                        <span class="rowbucks-amount">${rowbucks} Rowbucks</span>
                        <button class="btn-small" onclick="enhancedTradingUI.showBuyRowbucks()">Buy More</button>
                    </div>
                    ${tradeStreak.currentStreak > 0 ? `
                        <div class="streak-display">
                            <span class="streak-icon">🔥</span>
                            <span class="streak-text">${tradeStreak.currentStreak} Day Streak!</span>
                            ${tradeStreak.multiplier > 1 ? `<span class="streak-multiplier">${tradeStreak.multiplier}x Bonus</span>` : ''}
                        </div>
                    ` : ''}
                    ${expertStatus ? `
                        <div class="expert-status">
                            <span class="expert-badge ${expertStatus.level}">${this.getExpertLabel(expertStatus.level)}</span>
                            <span class="expert-stats">${expertStatus.tradesCompleted} trades • ${expertStatus.averageRating.toFixed(1)} ⭐</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="hub-actions">
                    <button class="action-btn swap-btn" onclick="enhancedTradingUI.showBrowse()">
                        <span class="action-icon">↔️</span>
                        <span class="action-title">Swap It</span>
                        <span class="action-desc">Swap your game items with friends</span>
                    </button>
                    
                    <button class="action-btn trade-btn" onclick="enhancedTradingUI.showBrowse()">
                        <span class="action-icon">⇄</span>
                        <span class="action-title">Trade It</span>
                        <span class="action-desc">Trade Rowblocks Fish for Animal Crossing Glam</span>
                    </button>
                    
                    <button class="action-btn gift-btn" onclick="enhancedTradingUI.showGiftHub()">
                        <span class="action-icon">🎁</span>
                        <span class="action-title">Gift It</span>
                        <span class="action-desc">Gift a Gem or Rare Fish to a Buddy</span>
                    </button>
                    
                    <button class="action-btn stories-btn" onclick="enhancedTradingUI.showStoriesFeed()">
                        <span class="action-icon">🌟</span>
                        <span class="action-title">Success Stories</span>
                        <span class="action-desc">Learn from other traders' wins!</span>
                    </button>
                    
                    ${this.store.getState().currentUser?.user_metadata?.role === 'admin' ? `
                        <button class="action-btn admin-btn" onclick="enhancedTradingUI.showAdminDashboard()">
                            <span class="action-icon">🛡️</span>
                            <span class="action-title">Admin Dashboard</span>
                            <span class="action-desc">Moderation & Management</span>
                        </button>
                    ` : ''}
                </div>
                
                <div class="hub-nav">
                    <button onclick="enhancedTradingUI.showBrowse().catch(console.error)">Browse (Shared Games Only)</button>
                    <button onclick="enhancedTradingUI.showMyListings()">My Listings</button>
                    <button onclick="enhancedTradingUI.showMyOffers()">My Offers</button>
                    <button onclick="enhancedTradingUI.showFriends()">Friends</button>
                    <button onclick="enhancedTradingUI.showProfile()">Profile</button>
                    <button onclick="enhancedTradingUI.showReviews()">Reviews</button>
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
     * Show browse with shared-game-only filter
     */
    async showBrowse(): Promise<void> {
        this.container.style.display = 'block';
        
        // Sync listings from API
        try {
            await this.apiStore.getState().syncListings();
        } catch (error) {
            console.error('Error syncing listings:', error);
            // Fallback to local store
        }
        
        const listings = this.store.getState().getListingsWithSharedGames();
        const matchScores = this.store.getState().matchScores;
        const currentUser = this.store.getState().currentUser!;
        
        let listingsHTML = '';
        if (listings.length === 0) {
            listingsHTML = `
                <div class="empty-state">
                    <p>No listings from users with shared games.</p>
                    <p>💡 Invite friends who play your games to start trading!</p>
                </div>
            `;
        } else {
            listingsHTML = listings.map(listing => {
                const rating = listing.averageRating || 0;
                const reviewCount = listing.reviewCount || 0;
                const ratingDisplay = reviewCount > 0 
                    ? `<span class="listing-rating">${rating.toFixed(1)} ⭐ (${reviewCount})</span>`
                    : '';
                
                const buyNowButton = listing.buyNowPrice
                    ? `<button class="btn-buy-now" onclick="enhancedTradingUI.buyNow('${listing.id}')">
                           Buy Now: ${listing.buyNowPrice} 💰
                       </button>`
                    : '';
                
                const openToOffersBadge = listing.openToOffers
                    ? '<span class="badge-open">Open to Offers</span>'
                    : '';
                
                return `
                    <div class="listing-card enhanced">
                        <div class="listing-header">
                            <h3>${listing.itemName}</h3>
                            ${openToOffersBadge}
                        </div>
                        <p class="listing-game">From: ${this.getGameName(listing.gameId)}</p>
                        <p class="listing-desc">${listing.itemDescription}</p>
                        ${listing.listingType === 'open-to-offers' ? `
                            <div class="examples">
                                <strong>Example offers:</strong>
                                <ul>
                                    ${listing.examples?.map(ex => `<li>${ex}</li>`).join('') || '<li>Open to negotiation!</li>'}
                                </ul>
                            </div>
                        ` : `
                            <p class="listing-wants"><strong>Wants:</strong> ${listing.wants}</p>
                        `}
                        ${ratingDisplay}
                        <div class="listing-actions">
                            ${buyNowButton}
                            <button class="btn-primary" onclick="enhancedTradingUI.showMakeOffer('${listing.id}')">
                                Make Offer
                            </button>
                            <button class="btn-report" onclick="enhancedTradingUI.reportListing('${listing.id}')">
                                🚨 Report
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        this.container.innerHTML = `
            <div class="browse-page enhanced">
                <div class="page-header">
                    <button class="btn-back" onclick="enhancedTradingUI.showEnhancedHub()">← Back</button>
                    <h2>Browse Listings (Shared Games Only)</h2>
                    <div class="filter-info">
                        <span>💡 Only showing listings from users who share games with you</span>
                    </div>
                </div>
                <div class="listings-grid">
                    ${listingsHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Show create enhanced listing
     */
    showCreateEnhancedListing(): void {
        this.container.innerHTML = `
            <div class="create-listing-page enhanced">
                <div class="page-header">
                    <button class="btn-back" onclick="enhancedTradingUI.showMyListings()">← Back</button>
                    <h2>Create Listing</h2>
                </div>
                
                <form class="listing-form" onsubmit="enhancedTradingUI.submitEnhancedListing(event)">
                    <div class="form-group">
                        <label>Listing Type:</label>
                        <select name="listingType" required onchange="enhancedTradingUI.updateListingForm()">
                            <option value="sell">Sell (Buy Now Price)</option>
                            <option value="swap">Swap (Specific Trade)</option>
                            <option value="open-to-offers">Open to Offers</option>
                        </select>
                    </div>
                    
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
                        <input type="text" name="itemName" required placeholder="10 Clams from Fishing Game">
                    </div>
                    
                    <div class="form-group">
                        <label>Item Description:</label>
                        <textarea name="itemDescription" required></textarea>
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
                    
                    <div id="wants-section" class="form-group">
                        <label>What I Want:</label>
                        <input type="text" name="wants" placeholder="Animal Crossing Star Fragment">
                    </div>
                    
                    <div id="buy-now-section" class="form-group" style="display: none;">
                        <label>Buy Now Price (Rowbucks):</label>
                        <input type="number" name="buyNowPrice" min="1" placeholder="5">
                    </div>
                    
                    <div id="examples-section" class="form-group" style="display: none;">
                        <label>Example Offers (one per line):</label>
                        <textarea name="examples" placeholder="My Rowblocks Fish for your Fortnite Bullets&#10;My Gem + 2 Rowbucks for your AC Glam"></textarea>
                        <small>💡 These help traders understand what you're looking for!</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Create Listing</button>
                        <button type="button" class="btn-secondary" onclick="enhancedTradingUI.showMyListings()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    /**
     * Update listing form based on type
     */
    updateListingForm(): void {
        const select = document.querySelector('select[name="listingType"]') as HTMLSelectElement;
        const wantsSection = document.getElementById('wants-section');
        const buyNowSection = document.getElementById('buy-now-section');
        const examplesSection = document.getElementById('examples-section');
        
        if (!select || !wantsSection || !buyNowSection || !examplesSection) return;
        
        const type = select.value;
        
        if (type === 'sell') {
            wantsSection.style.display = 'none';
            buyNowSection.style.display = 'block';
            examplesSection.style.display = 'none';
        } else if (type === 'open-to-offers') {
            wantsSection.style.display = 'none';
            buyNowSection.style.display = 'none';
            examplesSection.style.display = 'block';
        } else {
            wantsSection.style.display = 'block';
            buyNowSection.style.display = 'none';
            examplesSection.style.display = 'none';
        }
    }
    
    /**
     * Submit enhanced listing
     */
    async submitEnhancedListing(event: Event): Promise<void> {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const listingType = formData.get('listingType') as 'sell' | 'swap' | 'open-to-offers';
        const examples = formData.get('examples')?.toString().split('\n').filter(e => e.trim()) || [];
        
        try {
            // Use API if authenticated, otherwise fallback to local
            if (this.apiStore && typeof this.apiStore.getState().addListingAPI === 'function') {
                await this.apiStore.getState().addListingAPI({
            userId: this.store.getState().currentUser?.id || '',
            gameId: formData.get('gameId') as string,
            itemName: formData.get('itemName') as string,
            itemDescription: formData.get('itemDescription') as string,
            itemType: formData.get('itemType') as any,
                    wants: formData.get('wants') as string || '',
                    listingType,
                    buyNowPrice: listingType === 'sell' ? parseInt(formData.get('buyNowPrice') as string) : undefined,
                    openToOffers: listingType === 'open-to-offers',
                    examples: listingType === 'open-to-offers' ? examples : undefined,
                });
            } else {
                // Fallback to local store
                this.store.getState().addEnhancedListing({
                    userId: this.store.getState().currentUser?.id || '',
                    gameId: formData.get('gameId') as string,
                    itemName: formData.get('itemName') as string,
                    itemDescription: formData.get('itemDescription') as string,
                    itemType: formData.get('itemType') as any,
                    wants: formData.get('wants') as string || '',
                    listingType,
                    buyNowPrice: listingType === 'sell' ? parseInt(formData.get('buyNowPrice') as string) : undefined,
                    openToOffers: listingType === 'open-to-offers',
                    examples: listingType === 'open-to-offers' ? examples : undefined,
                });
            }
            
            alert('✅ Listing created!');
            this.showMyListings();
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        }
    }
    
    /**
     * Buy now with Rowbucks
     */
    async buyNow(listingId: string): Promise<void> {
        const listing = this.store.getState().listings.find(l => l.id === listingId) as EnhancedListing;
        if (!listing || !listing.buyNowPrice) return;
        
        if (confirm(`Buy "${listing.itemName}" for ${listing.buyNowPrice} Rowbucks?`)) {
            try {
                // In real implementation, would call API to process purchase
                // For now, use local store
                if (this.store.getState().spendRowbucks(listing.buyNowPrice, `Bought ${listing.itemName}`)) {
                    // Mark listing as traded (would update via API in production)
                    // Update listing status (would be done via API in production)
                    useTradingStoreExtended.setState((state) => ({
                        listings: state.listings.map(l =>
                            l.id === listingId ? { ...l, status: 'traded' as const } : l
                        ),
                    }));
                    alert('✅ Purchase complete!');
                    this.showBrowse();
                } else {
                    alert('❌ Not enough Rowbucks!');
                }
            } catch (error: any) {
                alert(`❌ Error: ${error.message}`);
            }
        }
    }
    
    /**
     * Show reviews page
     */
    showReviews(): void {
        this.container.style.display = 'block';
        const reviews = this.store.getState().reviews;
        const userRating = this.store.getState().getUserRating(this.store.getState().currentUser?.id || '');
        
        this.container.innerHTML = `
            <div class="reviews-page">
                <div class="page-header">
                    <button class="btn-back" onclick="enhancedTradingUI.showEnhancedHub()">← Back</button>
                    <h2>Reviews & Ratings</h2>
                </div>
                
                <div class="my-rating">
                    <h3>My Rating</h3>
                    <div class="rating-display">
                        <span class="rating-stars">${'⭐'.repeat(Math.round(userRating.average))}</span>
                        <span class="rating-text">${userRating.average.toFixed(1)} / 5.0 (${userRating.count} reviews)</span>
                    </div>
                </div>
                
                <div class="reviews-list">
                    <h3>Recent Reviews</h3>
                    ${reviews.length === 0 
                        ? '<p class="empty-state">No reviews yet. Complete trades to get reviews!</p>'
                        : reviews.slice(-10).reverse().map(review => `
                            <div class="review-card">
                                <div class="review-header">
                                    <span class="review-stars">${'⭐'.repeat(review.rating)}</span>
                                    <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p class="review-comment">${review.comment}</p>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }
    
    /**
     * Show buy Rowbucks modal
     */
    showBuyRowbucks(): void {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>💰 Buy Rowbucks</h2>
                <div class="rowbucks-packages">
                    <div class="package" onclick="enhancedTradingUI.purchaseRowbucks(10)">
                        <h3>10 Rowbucks</h3>
                        <p class="price">$0.99 (Demo)</p>
                    </div>
                    <div class="package" onclick="enhancedTradingUI.purchaseRowbucks(50)">
                        <h3>50 Rowbucks</h3>
                        <p class="price">$4.99 (Demo)</p>
                        <span class="bonus">+5 Bonus!</span>
                    </div>
                    <div class="package" onclick="enhancedTradingUI.purchaseRowbucks(100)">
                        <h3>100 Rowbucks</h3>
                        <p class="price">$9.99 (Demo)</p>
                        <span class="bonus">+15 Bonus!</span>
                    </div>
                </div>
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    /**
     * Purchase Rowbucks (demo)
     */
    purchaseRowbucks(amount: number): void {
        this.store.getState().buyRowbucks(amount);
        alert(`✅ Purchased ${amount} Rowbucks! (Demo mode)`);
        document.querySelector('.modal-overlay')?.remove();
        this.showEnhancedHub();
    }
    
    /**
     * Report listing
     */
    async reportListing(listingId: string): Promise<void> {
        const reason = prompt('Why are you reporting this listing?\n\nOptions: Suspicious, Inappropriate, Scam, Other');
        if (reason) {
            try {
            if (this.apiStore && typeof this.apiStore.getState().submitReportAPI === 'function') {
                await this.apiStore.getState().submitReportAPI({
                        reporterId: this.store.getState().currentUser?.id || '',
                        reportedListingId: listingId,
                        reason: 'Listing Report',
                        details: reason,
                    });
                } else {
                    this.store.getState().submitReport({
                        reporterId: this.store.getState().currentUser?.id || '',
                        reportedListingId: listingId,
                        reason: 'Listing Report',
                        details: reason,
                    });
                }
                alert('✅ Report submitted. Thank you for keeping Row-Trader safe!');
            } catch (error: any) {
                alert(`❌ Error: ${error.message}`);
            }
        }
    }
    
    /**
     * Show gift hub
     */
    showGiftHub(): void {
        if (window.friendsListUI) {
            window.friendsListUI.show();
        } else {
            alert('Friends list not available. Please add friends first!');
        }
    }
    
    /**
     * Show friends (delegate to FriendsListUI)
     */
    showFriends(): void {
        if (window.friendsListUI) {
            window.friendsListUI.show();
        }
    }
    
    /**
     * Show profile with expert status
     */
    showProfile(): void {
        this.container.style.display = 'block';
        const currentUser = this.store.getState().currentUser!;
        const expertStatus = this.store.getState().expertStatus;
        const rowbucks = this.store.getState().rowbucks;
        
        this.container.innerHTML = `
            <div class="profile-page enhanced">
                <div class="page-header">
                    <button class="btn-back" onclick="enhancedTradingUI.showEnhancedHub()">← Back</button>
                    <h2>My Profile</h2>
                </div>
                
                ${expertStatus ? `
                    <div class="expert-status-card">
                        <h3>Expert Status</h3>
                        <div class="expert-badge-large ${expertStatus.level}">
                            ${this.getExpertLabel(expertStatus.level)}
                        </div>
                        <div class="expert-stats-grid">
                            <div class="stat">
                                <span class="stat-label">Trades Completed</span>
                                <span class="stat-value">${expertStatus.tradesCompleted}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Average Rating</span>
                                <span class="stat-value">${expertStatus.averageRating.toFixed(1)} ⭐</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Negotiation Skill</span>
                                <span class="stat-value">${expertStatus.negotiationSkill.toFixed(0)}/100</span>
                            </div>
                        </div>
                        ${expertStatus.badges.length > 0 ? `
                            <div class="badges">
                                <h4>Badges:</h4>
                                ${expertStatus.badges.map(badge => `<span class="badge">${badge}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="profile-section">
                    <label>Username:</label>
                    <input type="text" id="profile-username" value="${currentUser.username}">
                </div>
                
                <div class="profile-section">
                    <label>Rowbucks:</label>
                    <div class="rowbucks-display">💰 ${rowbucks}</div>
                </div>
                
                <div class="profile-section">
                    <label>Favorite Games:</label>
                    <div class="games-select">
                        ${this.store.getState().availableGames.map(game => `
                            <label class="game-checkbox">
                                <input type="checkbox" value="${game.id}" 
                                       ${currentUser.favoriteGames.includes(game.id) ? 'checked' : ''}
                                       onchange="enhancedTradingUI.updateFavoriteGames()">
                                <span>${game.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <button class="btn-primary" onclick="enhancedTradingUI.saveProfile()">Save Profile</button>
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
            this.store.getState().setCurrentUser({
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
                    <button class="btn-secondary" onclick="enhancedTradingUI.removeListing('${listing.id}')">Remove</button>
                </div>
            `).join('');
        }
        
        this.container.innerHTML = `
            <div class="my-listings-page">
                <div class="page-header">
                    <button class="btn-back" onclick="enhancedTradingUI.showEnhancedHub()">← Back</button>
                    <h2>My Listings</h2>
                    <button class="btn-primary" onclick="enhancedTradingUI.showCreateEnhancedListing()">+ Create Listing</button>
                </div>
                <div class="listings-grid">
                    ${listingsHTML}
                </div>
            </div>
        `;
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
                        ${offer.status === 'accepted' ? `
                            <button class="btn-primary" onclick="enhancedTradingUI.showReviewForm('${offer.id}')">
                                ⭐ Leave Review
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
        
        this.container.innerHTML = `
            <div class="my-offers-page">
                <div class="page-header">
                    <button class="btn-back" onclick="enhancedTradingUI.showEnhancedHub()">← Back</button>
                    <h2>My Offers</h2>
                </div>
                <div class="offers-list">
                    ${offersHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Show review form
     */
    showReviewForm(offerId: string): void {
        const offer = this.store.getState().offers.find(o => o.id === offerId);
        if (!offer) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>⭐ Leave Review</h2>
                <form onsubmit="enhancedTradingUI.submitReview(event, '${offerId}')">
                    <div class="form-group">
                        <label>Rating (1-5 stars):</label>
                        <select name="rating" required>
                            <option value="5">5 ⭐ Excellent</option>
                            <option value="4">4 ⭐ Good</option>
                            <option value="3">3 ⭐ Okay</option>
                            <option value="2">2 ⭐ Poor</option>
                            <option value="1">1 ⭐ Very Poor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Comment:</label>
                        <textarea name="comment" required placeholder="How was the trade?"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Submit Review</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    /**
     * Submit review
     */
    submitReview(event: Event, offerId: string): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const offer = this.store.getState().offers.find(o => o.id === offerId);
        if (!offer) return;
        
        this.store.getState().addReview({
            tradeId: offerId,
            fromUserId: this.store.getState().currentUser?.id || '',
            toUserId: offer.toUserId,
            rating: parseInt(formData.get('rating') as string),
            comment: formData.get('comment') as string,
        });
        
        // Earn Rowbucks for leaving review
        this.store.getState().addRowbucks(2, 'Left review');
        
        alert('✅ Review submitted! Thanks for helping the community!');
        (event.target as HTMLElement).closest('.modal-overlay')?.remove();
        this.showMyOffers();
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
     * Show make offer (enhanced)
     */
    showMakeOffer(listingId: string): void {
        const listing = this.store.getState().listings.find(l => l.id === listingId) as EnhancedListing;
        if (!listing) {
            alert('Listing not found');
            return;
        }
        
        const currentUser = this.store.getState().currentUser;
        if (!currentUser) {
            alert('Please log in to make an offer');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Make Offer</h2>
                <p><strong>Listing:</strong> ${listing.itemName}</p>
                <p><strong>From:</strong> ${this.getGameName(listing.gameId)}</p>
                ${listing.wants ? `<p><strong>Wants:</strong> ${listing.wants}</p>` : ''}
                ${listing.examples ? `
                    <div class="examples">
                        <strong>Example Offers:</strong>
                        <ul>
                            ${listing.examples.map(ex => `<li>${ex}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <form class="offer-form" onsubmit="enhancedTradingUI.submitOffer(event, '${listingId}')">
                    <div class="form-group">
                        <label>What I'm Offering:</label>
                        <textarea name="offering" required placeholder="e.g., 10 Clams from Fishing Game"></textarea>
                    </div>
                    <div class="form-group">
                        <label>What I Want:</label>
                        <input type="text" name="wanting" required placeholder="${listing.wants || 'e.g., Animal Crossing Star Fragment'}" value="${listing.wants || ''}">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Make Offer</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    /**
     * Submit offer (with optional barter mini-game)
     */
    async submitOffer(event: Event, listingId: string): Promise<void> {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const offering = formData.get('offering') as string;
        const wanting = formData.get('wanting') as string;
        
        // Safety check
        if (this.store.getState().checkSafetyViolations(offering + ' ' + wanting)) {
            alert('⚠️ Your offer contains prohibited content. Please revise.');
            return;
        }
        
        // Show barter mini-game (optional)
        const playGame = confirm('🎮 Want to play a quick Rowblocks puzzle for bonus Rowbucks?');
        let bonusRowbucks = 0;
        
        if (playGame) {
            const { BarterMiniGameUI } = await import('./BarterMiniGameUI');
            const gameUI = new BarterMiniGameUI();
            
            await new Promise<void>((resolve) => {
                gameUI.show((result) => {
                    bonusRowbucks = result.bonusRowbucks;
                    if (result.won && bonusRowbucks > 0) {
                        this.store.getState().addRowbucks(bonusRowbucks, 'Barter mini-game bonus');
                    }
                    resolve();
                });
            });
        }
        
        try {
            if (this.apiStore && typeof this.apiStore.getState().makeOfferAPI === 'function') {
                await this.apiStore.getState().makeOfferAPI({
                    listingId,
                    offering,
                    wanting,
                });
            } else {
                this.store.getState().makeOffer({
                    listingId,
                    fromUserId: this.store.getState().currentUser?.id || '',
                    toUserId: this.store.getState().listings.find(l => l.id === listingId)?.userId || '',
                    offering,
                    wanting,
                    status: 'pending',
                });
            }
            
            if (bonusRowbucks > 0) {
                alert(`✅ Offer submitted! 🎉 You earned ${bonusRowbucks} bonus Rowbucks!`);
            } else {
                alert('✅ Offer submitted!');
            }
            (event.target as HTMLElement).closest('.modal-overlay')?.remove();
            this.showMyOffers();
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        }
    }
    
    /**
     * Get expert label
     */
    private getExpertLabel(level: string): string {
        switch (level) {
            case 'newbie': return '🟢 Newbie Trader';
            case 'bargain-hunter': return '🟡 Bargain Hunter';
            case 'master-barterer': return '🔴 Master Barterer';
            default: return 'Trader';
        }
    }
    
    /**
     * Get game name
     */
    private getGameName(gameId: string): string {
        const game = this.store.getState().availableGames.find(g => g.id === gameId);
        return game?.name || gameId;
    }
    
    /**
     * Inject styles
     */
    private injectStyles(): void {
        if (document.getElementById('enhanced-trading-ui-styles')) return;
        
        // Link external CSS file
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/ui/trading-styles.css';
        link.id = 'enhanced-trading-ui-styles';
        document.head.appendChild(link);
        
        // Also inject inline styles for critical components
        const style = document.createElement('style');
        style.id = 'enhanced-trading-ui-inline-styles';
        style.textContent = `
            .status-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: rgba(26, 58, 90, 0.5);
                border-radius: 10px;
                margin: 1rem 0;
            }
            
            .rowbucks-display {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .expert-status {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .expert-badge {
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-weight: bold;
            }
            
            .expert-badge.newbie {
                background: #00ff00;
                color: #001133;
            }
            
            .expert-badge.bargain-hunter {
                background: #ffaa00;
                color: #001133;
            }
            
            .expert-badge.master-barterer {
                background: #ff0000;
                color: #fff;
            }
            
            .badge-open {
                background: #06B6D4;
                color: #001133;
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .btn-buy-now {
                background: #ffaa00;
                color: #001133;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .btn-report {
                background: #ff4444;
                color: #fff;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .rowbucks-packages {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin: 2rem 0;
            }
            
            .package {
                background: rgba(26, 58, 90, 0.7);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 1.5rem;
                text-align: center;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .package:hover {
                transform: translateY(-5px);
            }
            
            .expert-status-card {
                background: rgba(26, 58, 90, 0.7);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 2rem;
                margin-bottom: 2rem;
            }
            
            .expert-badge-large {
                font-size: 2rem;
                text-align: center;
                margin: 1rem 0;
            }
            
            .expert-stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .stat {
                text-align: center;
            }
            
            .stat-label {
                display: block;
                color: #88d0ff;
                font-size: 0.9rem;
            }
            
            .stat-value {
                display: block;
                font-size: 1.5rem;
                font-weight: bold;
                color: #06B6D4;
            }
        `;
        document.head.appendChild(style);
    }
}

// Make globally accessible
declare global {
    interface Window {
        enhancedTradingUI: EnhancedTradingUI;
    }
}
