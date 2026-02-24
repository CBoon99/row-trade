/**
 * Success Stories Feed UI Component
 * Shows anonymized success tales to teach by example
 */

import { useTradingStoreExtended, SuccessStory } from '../stores/TradingStoreExtended';

export class StoriesFeedUI {
    private container: HTMLElement;
    private store = useTradingStoreExtended;
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Show stories feed
     */
    show(): void {
        this.container.style.display = 'block';
        const stories = this.store.getState().successStories;
        
        // Generate some example stories if none exist
        const displayStories = stories.length > 0 
            ? stories 
            : this.generateExampleStories();
        
        this.container.innerHTML = `
            <div class="stories-feed-page">
                <div class="page-header">
                    <button class="btn-back" onclick="window.storiesFeedUI.hide()">← Back</button>
                    <h2>🌟 Success Stories</h2>
                    <p class="subtitle">Learn from other traders' wins!</p>
                </div>
                
                <div class="stories-list">
                    ${displayStories.map(story => this.renderStory(story)).join('')}
                </div>
                
                <div class="stories-footer">
                    <p>💡 These stories are anonymized to protect privacy</p>
                    <p>Share your own success by completing trades!</p>
                </div>
            </div>
        `;
        
        (window as any).storiesFeedUI = this;
    }
    
    /**
     * Render a single story
     */
    private renderStory(story: SuccessStory): string {
        const emoji = story.tradeType === 'Swap' ? '↔️' : story.tradeType === 'Buy' ? '💰' : '🎁';
        
        return `
            <div class="story-card">
                <div class="story-header">
                    <span class="story-emoji">${emoji}</span>
                    <span class="story-type">${story.tradeType}</span>
                </div>
                <p class="story-text">${story.story}</p>
                <div class="story-footer">
                    <span class="story-date">${this.formatDate(story.createdAt)}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Format date
     */
    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    }
    
    /**
     * Generate example stories
     */
    private generateExampleStories(): SuccessStory[] {
        return [
            {
                id: 'example-1',
                story: "A trader swapped their Rowblocks Abyssal Gem for Animal Crossing Star Fragments! They started with a low offer, then negotiated up. Great bartering skills!",
                tradeType: 'Swap',
                createdAt: Date.now() - 86400000, // 1 day ago
            },
            {
                id: 'example-2',
                story: "Someone traded 10 Rowblocks Fish for Fortnite V-Bucks! They used the 'counter-offer' feature to find a fair deal. Win-win!",
                tradeType: 'Swap',
                createdAt: Date.now() - 172800000, // 2 days ago
            },
            {
                id: 'example-3',
                story: "A newbie trader completed their first trade and earned 5 Rowbucks! They're now a Bargain Hunter. Keep it up!",
                tradeType: 'Gift',
                createdAt: Date.now() - 259200000, // 3 days ago
            },
            {
                id: 'example-4',
                story: "Master Barterer status achieved! This trader completed 25+ trades with 4.8⭐ average rating. They're a trading legend!",
                tradeType: 'Swap',
                createdAt: Date.now() - 345600000, // 4 days ago
            },
        ];
    }
    
    /**
     * Hide stories feed
     */
    hide(): void {
        this.container.style.display = 'none';
    }
}
