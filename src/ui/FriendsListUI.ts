import { useTradingStoreExtended, Friend } from '../stores/TradingStoreExtended';
import { useTradingStoreWithAPI } from '../stores/TradingStoreWithAPI';

export class FriendsListUI {
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
     * Show friends list
     */
    show(): void {
        this.container.style.display = 'block';
        
        // Sync friends from API (async, don't block)
        this.apiStore.getState().syncFriends().catch(console.error);
        
        const friends = this.store.getState().getFriendsWithSharedGames();
        const allFriends = this.store.getState().friends;
        
        this.container.innerHTML = `
            <div class="friends-page">
                <div class="page-header">
                    <h2>👥 My Friends</h2>
                    <button class="btn-primary" onclick="friendsListUI.showAddFriend()">+ Add Friend</button>
                </div>
                
                <div class="friends-tabs">
                    <button class="tab-btn active" onclick="friendsListUI.showTab('shared')">
                        Shared Games (${friends.length})
                    </button>
                    <button class="tab-btn" onclick="friendsListUI.showTab('all')">
                        All Friends (${allFriends.length})
                    </button>
                    <button class="tab-btn" onclick="friendsListUI.showTab('requests')">
                        Requests (${this.store.getState().friendRequests.length})
                    </button>
                </div>
                
                <div id="friends-content">
                    ${this.renderFriendsList(friends)}
                </div>
            </div>
        `;
        
        this.injectStyles();
    }
    
    /**
     * Show add friend form
     */
    showAddFriend(): void {
        this.container.innerHTML = `
            <div class="add-friend-page">
                <div class="page-header">
                    <button class="btn-back" onclick="friendsListUI.show()">← Back</button>
                    <h2>Add Friend</h2>
                </div>
                
                <div class="add-friend-form">
                    <div class="form-group">
                        <label>Search by Username:</label>
                        <input type="text" id="friend-username" placeholder="Enter username">
                        <small>💡 Friends must share at least one game with you!</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Or Enter Friend Code:</label>
                        <input type="text" id="friend-code" placeholder="Friend code">
                    </div>
                    
                    <button class="btn-primary" onclick="friendsListUI.searchFriend()">Search</button>
                    
                    <div id="search-results" style="margin-top: 2rem;"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Search for friend
     */
    searchFriend(): void {
        const usernameInput = document.getElementById('friend-username') as HTMLInputElement;
        const codeInput = document.getElementById('friend-code') as HTMLInputElement;
        const resultsDiv = document.getElementById('search-results');
        
        if (!resultsDiv) return;
        
        const username = usernameInput?.value.trim();
        const code = codeInput?.value.trim();
        
        if (!username && !code) {
            resultsDiv.innerHTML = '<p class="error">Please enter a username or friend code</p>';
            return;
        }
        
        // Demo: In real app, would search backend
        // For demo, show mock result
        resultsDiv.innerHTML = `
            <div class="search-result-card">
                <h3>${username || 'Friend'}</h3>
                <p>Shared Games: Rowblocks, Animal Crossing (2 games)</p>
                <p>Rating: 4.5 ⭐ (10 reviews)</p>
                <button class="btn-primary" onclick="friendsListUI.sendFriendRequest('${username || code}')">
                    Send Friend Request
                </button>
            </div>
        `;
    }
    
    /**
     * Send friend request
     */
    async sendFriendRequest(userId: string): Promise<void> {
        try {
            if (this.apiStore && typeof this.apiStore.getState().addFriendAPI === 'function') {
                await this.apiStore.getState().addFriendAPI(userId);
            } else {
                this.store.getState().sendFriendRequest(userId);
            }
            alert('✅ Friend request sent!');
            await this.refreshFriends();
            this.show();
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        }
    }
    
    /**
     * Refresh friends from API
     */
    async refreshFriends(): Promise<void> {
        try {
            await this.apiStore.syncFriends();
        } catch (error) {
            console.error('Error refreshing friends:', error);
        }
    }
    
    /**
     * Show tab content
     */
    showTab(tab: 'shared' | 'all' | 'requests'): void {
        const contentDiv = document.getElementById('friends-content');
        if (!contentDiv) return;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event?.target && (event.target as HTMLElement).classList.add('active');
        
        if (tab === 'shared') {
            contentDiv.innerHTML = this.renderFriendsList(this.store.getState().getFriendsWithSharedGames());
        } else if (tab === 'all') {
            contentDiv.innerHTML = this.renderFriendsList(this.store.getState().friends);
        } else {
            contentDiv.innerHTML = this.renderFriendRequests();
        }
    }
    
    /**
     * Render friends list
     */
    private renderFriendsList(friends: Friend[]): string {
        if (friends.length === 0) {
            return '<p class="empty-state">No friends yet. Add friends to start trading!</p>';
        }
        
        return `
            <div class="friends-grid">
                ${friends.map(friend => `
                    <div class="friend-card">
                        <div class="friend-header">
                            <h3>${friend.username}</h3>
                            <span class="status-badge ${friend.onlineStatus}">${friend.onlineStatus}</span>
                        </div>
                        <p class="shared-games">${friend.sharedGamesCount} shared game${friend.sharedGamesCount !== 1 ? 's' : ''}</p>
                        <div class="friend-actions">
                            <button class="btn-primary" onclick="friendsListUI.showGiftForm('${friend.id}')">
                                🎁 Gift Item
                            </button>
                            <button class="btn-secondary" onclick="friendsListUI.showQuickTrade('${friend.id}')">
                                ⇄ Quick Trade
                            </button>
                            <button class="btn-danger" onclick="friendsListUI.removeFriend('${friend.id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render friend requests
     */
    private renderFriendRequests(): string {
        const requests = this.store.getState().friendRequests;
        
        if (requests.length === 0) {
            return '<p class="empty-state">No pending friend requests</p>';
        }
        
        return `
            <div class="requests-list">
                ${requests.map(request => `
                    <div class="request-card">
                        <h3>Friend Request</h3>
                        <p>From: User ${request.fromUserId}</p>
                        <div class="request-actions">
                            <button class="btn-primary" onclick="friendsListUI.acceptRequest('${request.id}')">
                                Accept
                            </button>
                            <button class="btn-secondary" onclick="friendsListUI.declineRequest('${request.id}')">
                                Decline
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Show gift form
     */
    showGiftForm(friendId: string): void {
        const friend = this.store.getState().friends.find(f => f.id === friendId);
        if (!friend) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🎁 Gift to ${friend.username}</h2>
                <form onsubmit="friendsListUI.submitGift(event, '${friendId}')">
                    <div class="form-group">
                        <label>Item Name:</label>
                        <input type="text" name="itemName" required placeholder="Rowblocks Abyssal Gem">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea name="description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Game:</label>
                        <select name="gameId" required>
                            ${this.store.getState().availableGames.map(g => `
                                <option value="${g.id}">${g.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Bonus Rowbucks (optional):</label>
                        <input type="number" name="rowbucksBonus" min="0" value="0">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Send Gift</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    /**
     * Submit gift
     */
    async submitGift(event: Event, friendId: string): Promise<void> {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        try {
            if (this.apiStore && typeof this.apiStore.getState().sendGiftAPI === 'function') {
                await this.apiStore.getState().sendGiftAPI({
                    fromUserId: this.store.getState().currentUser?.id || '',
            toUserId: friendId,
            itemName: formData.get('itemName') as string,
            itemDescription: formData.get('description') as string,
                    gameId: formData.get('gameId') as string,
                    rowbucksBonus: parseInt(formData.get('rowbucksBonus') as string) || 0,
                });
            } else {
                this.store.getState().sendGift({
                    fromUserId: this.store.getState().currentUser?.id || '',
                    toUserId: friendId,
                    itemName: formData.get('itemName') as string,
                    itemDescription: formData.get('description') as string,
                    gameId: formData.get('gameId') as string,
                    rowbucksBonus: parseInt(formData.get('rowbucksBonus') as string) || 0,
                });
            }
            
            alert('✅ Gift sent!');
            (event.target as HTMLElement).closest('.modal-overlay')?.remove();
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        }
    }
    
    /**
     * Show quick trade
     */
    showQuickTrade(friendId: string): void {
        // Redirect to trading hub with friend filter
        if (window.tradingUI) {
            window.tradingUI.showBrowse();
        }
    }
    
    /**
     * Remove friend
     */
    removeFriend(friendId: string): void {
        if (confirm('Remove this friend?')) {
            this.store.getState().removeFriend(friendId);
            this.show();
        }
    }
    
    /**
     * Accept friend request
     */
    acceptRequest(requestId: string): void {
        this.store.getState().acceptFriendRequest(requestId);
        this.showTab('all');
    }
    
    /**
     * Decline friend request
     */
    declineRequest(requestId: string): void {
        // Remove from requests
        useTradingStoreExtended.setState((state) => ({
            friendRequests: state.friendRequests.filter(r => r.id !== requestId),
        }));
        this.showTab('requests');
    }
    
    /**
     * Inject styles
     */
    private injectStyles(): void {
        if (document.getElementById('friends-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'friends-ui-styles';
        style.textContent = `
            .friends-page {
                padding: 2rem;
                color: #fff;
            }
            
            .friends-tabs {
                display: flex;
                gap: 1rem;
                margin: 2rem 0;
            }
            
            .tab-btn {
                background: #1a3a5a;
                border: 1px solid #06B6D4;
                color: #fff;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .tab-btn.active {
                background: #06B6D4;
                color: #001133;
            }
            
            .friends-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1.5rem;
            }
            
            .friend-card {
                background: rgba(26, 58, 90, 0.7);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 1.5rem;
            }
            
            .friend-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
            }
            
            .status-badge.online {
                background: #00ff00;
                color: #001133;
            }
            
            .status-badge.offline {
                background: #666;
                color: #fff;
            }
            
            .friend-actions {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .btn-danger {
                background: #ff4444;
                color: #fff;
                border: none;
                padding: 0.5rem;
                border-radius: 6px;
                cursor: pointer;
            }
            
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: #001133;
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
            }
        `;
        document.head.appendChild(style);
    }
}

// Make globally accessible
declare global {
    interface Window {
        friendsListUI: FriendsListUI;
    }
}
