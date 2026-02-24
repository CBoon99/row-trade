/**
 * Trading API Client
 * Handles all API calls to Netlify Functions
 */

import { authManager } from '../systems/AuthManager';

const API_BASE = '/.netlify/functions';

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authManager.getToken();
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API call failed');
    }

    return response.json();
}

export const tradingApi = {
    /**
     * Create listing
     */
    async createListing(data: {
        gameId: string;
        itemName: string;
        itemDescription: string;
        itemType: 'block' | 'fish' | 'gem' | 'skin' | 'other';
        listingType: 'sell' | 'swap' | 'open-to-offers';
        wants?: string;
        buyNowPrice?: number;
        openToOffers?: boolean;
        examples?: string[];
        photoUrls?: string[];
    }) {
        return apiCall('/api-create-listing', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    /**
     * Upload image (for listings/reviews)
     */
    async uploadImage(file: File, type: 'listing' | 'review' | 'avatar'): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const response = await fetch('/.netlify/functions/api-upload-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authManager.getToken()}`,
            },
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return data.imageUrl;
    },

    /**
     * Get matches (listings with shared games)
     */
    async getMatches() {
        return apiCall('/api-get-matches', {
            method: 'GET',
        });
    },

    /**
     * Make offer
     */
    async makeOffer(data: {
        listingId: string;
        offering: string;
        wanting: string;
    }) {
        return apiCall('/api-make-offer', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Accept trade
     */
    async acceptTrade(offerId: string) {
        return apiCall('/api-accept-trade', {
            method: 'POST',
            body: JSON.stringify({ offerId }),
        });
    },

    /**
     * Get friends
     */
    async getFriends() {
        return apiCall('/api-get-friends', {
            method: 'GET',
        });
    },

    /**
     * Add friend
     */
    async addFriend(friendId: string) {
        return apiCall('/api-add-friend', {
            method: 'POST',
            body: JSON.stringify({ friendId }),
        });
    },

    /**
     * Send gift
     */
    async sendGift(data: {
        toUserId: string;
        itemName: string;
        itemDescription: string;
        gameId: string;
        rowbucksBonus?: number;
    }) {
        return apiCall('/api-send-gift', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Add review
     */
    async addReview(data: {
        tradeId: string;
        rating: number;
        comment: string;
    }) {
        return apiCall('/api-add-review', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Submit report
     */
    async submitReport(data: {
        reportedUserId?: string;
        reportedListingId?: string;
        reportedMessageId?: string;
        reason: string;
        details: string;
    }) {
        return apiCall('/api-report', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
