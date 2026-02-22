import { create } from 'zustand';
import { Game, User, Listing, Offer, Message } from './TradingStore';

// Extended interfaces for final phase
export interface Friend {
    id: string;
    username: string;
    favoriteGames: string[];
    onlineStatus: 'online' | 'offline';
    sharedGamesCount: number;
    addedAt: number;
}

export interface Review {
    id: string;
    tradeId: string;
    fromUserId: string;
    toUserId: string;
    rating: number; // 1-5 stars
    comment: string;
    createdAt: number;
}

export interface Report {
    id: string;
    reporterId: string;
    reportedUserId?: string;
    reportedListingId?: string;
    reportedMessageId?: string;
    reason: string;
    details: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: number;
}

export interface ParentalControl {
    userId: string;
    parentEmail: string;
    maxTradeValue: number; // Max Rowbucks per trade
    requireApproval: boolean; // Require parent approval for trades
    friendApproval: boolean; // Require approval for friend requests
    chatLogsEnabled: boolean; // Parent can view chat logs
    restrictions: {
        noExternalLinks: boolean;
        noImages: boolean;
        wordFilter: boolean;
    };
}

export interface ExpertStatus {
    level: 'newbie' | 'bargain-hunter' | 'master-barterer';
    tradesCompleted: number;
    averageRating: number;
    totalStars: number;
    badges: string[];
    negotiationSkill: number; // 0-100
}

export interface EnhancedListing extends Listing {
    listingType: 'sell' | 'swap' | 'open-to-offers';
    buyNowPrice?: number; // Rowbucks price for "Buy Now"
    openToOffers: boolean;
    examples?: string[]; // Example offers
    averageRating?: number;
    reviewCount?: number;
}

export interface Gift {
    id: string;
    fromUserId: string;
    toUserId: string;
    itemName: string;
    itemDescription: string;
    gameId: string;
    rowbucksBonus?: number; // Optional Rowbucks attached
    createdAt: number;
    status: 'pending' | 'accepted' | 'declined';
}

interface TradingStoreExtended {
    // Existing from TradingStore
    currentUser: User | null;
    availableGames: Game[];
    listings: Listing[];
    myListings: Listing[];
    offers: Offer[];
    myOffers: Offer[];
    receivedOffers: Offer[];
    messages: Message[];
    conversations: { [userId: string]: Message[] };
    
    // New: Rowbucks
    rowbucks: number;
    rowbucksHistory: Array<{ type: 'earn' | 'spend' | 'gift'; amount: number; reason: string; timestamp: number }>;
    
    // New: Friends
    friends: Friend[];
    friendRequests: Array<{ id: string; fromUserId: string; toUserId: string; createdAt: number }>;
    
    // New: Reviews
    reviews: Review[];
    userRatings: { [userId: string]: { average: number; count: number } };
    
    // New: Reports & Safety
    reports: Report[];
    parentalControls: ParentalControl | null;
    safetyQuizCompleted: boolean;
    blockedUsers: string[];
    
    // New: Expert Status
    expertStatus: ExpertStatus | null;
    
    // New: Gifts
    gifts: Gift[];
    receivedGifts: Gift[];
    
    // Actions: Rowbucks
    addRowbucks: (amount: number, reason: string) => void;
    spendRowbucks: (amount: number, reason: string) => boolean;
    buyRowbucks: (amount: number) => void; // Demo purchase
    
    // Actions: Friends
    addFriend: (friendId: string, username: string, favoriteGames: string[]) => void;
    removeFriend: (friendId: string) => void;
    sendFriendRequest: (toUserId: string) => void;
    acceptFriendRequest: (requestId: string) => void;
    getFriendsWithSharedGames: () => Friend[];
    
    // Actions: Reviews
    addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
    getUserRating: (userId: string) => { average: number; count: number };
    
    // Actions: Reports & Safety
    submitReport: (report: Omit<Report, 'id' | 'status' | 'createdAt'>) => void;
    setParentalControls: (controls: ParentalControl) => void;
    completeSafetyQuiz: () => void;
    blockUser: (userId: string) => void;
    checkSafetyViolations: (content: string) => boolean;
    
    // Actions: Enhanced Listings
    addEnhancedListing: (listing: Omit<EnhancedListing, 'id' | 'createdAt' | 'status'>) => void;
    updateListingRating: (listingId: string) => void;
    
    // Actions: Gifts
    sendGift: (gift: Omit<Gift, 'id' | 'createdAt' | 'status'>) => void;
    acceptGift: (giftId: string) => void;
    declineGift: (giftId: string) => void;
    
    // Actions: Expert Status
    updateExpertStatus: () => void;
    getExpertLevel: (tradesCompleted: number) => 'newbie' | 'bargain-hunter' | 'master-barterer';
    calculateNegotiationSkill: () => number;
    
    // Actions: Shared Game Matching (strict)
    getListingsWithSharedGames: () => EnhancedListing[];
    canTradeWithUser: (userId: string) => boolean;
}

export const useTradingStoreExtended = create<TradingStoreExtended>((set, get) => ({
    // Existing state
    currentUser: null,
    availableGames: [],
    listings: [],
    myListings: [],
    offers: [],
    myOffers: [],
    receivedOffers: [],
    messages: [],
    conversations: {},
    
    // New state
    rowbucks: 0,
    rowbucksHistory: [],
    friends: [],
    friendRequests: [],
    reviews: [],
    userRatings: {},
    reports: [],
    parentalControls: null,
    safetyQuizCompleted: false,
    blockedUsers: [],
    expertStatus: null,
    gifts: [],
    receivedGifts: [],
    
    // Rowbucks actions
    addRowbucks: (amount, reason) => {
        set((state) => ({
            rowbucks: state.rowbucks + amount,
            rowbucksHistory: [
                ...state.rowbucksHistory,
                { type: 'earn', amount, reason, timestamp: Date.now() }
            ],
        }));
        const state = get();
        localStorage.setItem('row-trader-rowbucks', state.rowbucks.toString());
        localStorage.setItem('row-trader-rowbucks-history', JSON.stringify(state.rowbucksHistory));
    },
    
    spendRowbucks: (amount, reason) => {
        const current = get().rowbucks;
        if (current >= amount) {
            set((state) => ({
                rowbucks: state.rowbucks - amount,
                rowbucksHistory: [
                    ...state.rowbucksHistory,
                    { type: 'spend', amount, reason, timestamp: Date.now() }
                ],
            }));
            const state = get();
            localStorage.setItem('row-trader-rowbucks', state.rowbucks.toString());
            localStorage.setItem('row-trader-rowbucks-history', JSON.stringify(state.rowbucksHistory));
            return true;
        }
        return false;
    },
    
    buyRowbucks: (amount) => {
        // Demo purchase - in real app, integrate with payment API
        console.log(`Demo: Buying ${amount} Rowbucks`);
        get().addRowbucks(amount, 'Purchased Rowbucks');
    },
    
    // Friends actions
    addFriend: (friendId, username, favoriteGames) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        const sharedGames = currentUser.favoriteGames.filter(g => favoriteGames.includes(g));
        
        const friend: Friend = {
            id: friendId,
            username,
            favoriteGames,
            onlineStatus: 'offline',
            sharedGamesCount: sharedGames.length,
            addedAt: Date.now(),
        };
        
        set((state) => ({
            friends: [...state.friends, friend],
        }));
        const state = get();
        localStorage.setItem('row-trader-friends', JSON.stringify(state.friends));
    },
    
    removeFriend: (friendId) => {
        set((state) => ({
            friends: state.friends.filter(f => f.id !== friendId),
        }));
        const state = get();
        localStorage.setItem('row-trader-friends', JSON.stringify(state.friends));
    },
    
    sendFriendRequest: (toUserId) => {
        const request = {
            id: `request-${Date.now()}`,
            fromUserId: get().currentUser?.id || '',
            toUserId,
            createdAt: Date.now(),
        };
        set((state) => ({
            friendRequests: [...state.friendRequests, request],
        }));
    },
    
    acceptFriendRequest: (requestId) => {
        const request = get().friendRequests.find(r => r.id === requestId);
        if (!request) return;
        
        // In real app, would fetch user data
        get().addFriend(request.fromUserId, 'Friend', []); // Placeholder
        
        set((state) => ({
            friendRequests: state.friendRequests.filter(r => r.id !== requestId),
        }));
    },
    
    getFriendsWithSharedGames: () => {
        return get().friends.filter(f => f.sharedGamesCount > 0)
            .sort((a, b) => b.sharedGamesCount - a.sharedGamesCount);
    },
    
    // Reviews actions
    addReview: (reviewData) => {
        const review: Review = {
            ...reviewData,
            id: `review-${Date.now()}`,
            createdAt: Date.now(),
        };
        
        set((state) => {
            const reviews = [...state.reviews, review];
            const userReviews = reviews.filter(r => r.toUserId === review.toUserId);
            const average = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
            
            return {
                reviews,
                userRatings: {
                    ...state.userRatings,
                    [review.toUserId]: {
                        average,
                        count: userReviews.length,
                    },
                },
            };
        });
        
        const state = get();
        localStorage.setItem('row-trader-reviews', JSON.stringify(state.reviews));
        get().updateExpertStatus();
    },
    
    getUserRating: (userId) => {
        return get().userRatings[userId] || { average: 0, count: 0 };
    },
    
    // Reports & Safety actions
    submitReport: (reportData) => {
        const report: Report = {
            ...reportData,
            id: `report-${Date.now()}`,
            status: 'pending',
            createdAt: Date.now(),
        };
        
        set((state) => ({
            reports: [...state.reports, report],
        }));
        
        // Auto-flag suspicious content
        if (get().checkSafetyViolations(report.details)) {
            console.warn('⚠️ Safety violation detected in report');
        }
        
        const state = get();
        localStorage.setItem('row-trader-reports', JSON.stringify(state.reports));
    },
    
    setParentalControls: (controls) => {
        set({ parentalControls: controls });
        localStorage.setItem('row-trader-parental-controls', JSON.stringify(controls));
    },
    
    completeSafetyQuiz: () => {
        set({ safetyQuizCompleted: true });
        localStorage.setItem('row-trader-safety-quiz', 'completed');
    },
    
    blockUser: (userId) => {
        set((state) => ({
            blockedUsers: [...state.blockedUsers, userId],
        }));
        const state = get();
        localStorage.setItem('row-trader-blocked-users', JSON.stringify(state.blockedUsers));
    },
    
    checkSafetyViolations: (content) => {
        const violations = [
            'meet', 'irl', 'real life', 'address', 'phone', 'email',
            'password', 'personal info', 'outside', 'external',
        ];
        const lowerContent = content.toLowerCase();
        return violations.some(v => lowerContent.includes(v));
    },
    
    // Enhanced Listings
    addEnhancedListing: (listingData) => {
        const listing: EnhancedListing = {
            ...listingData,
            id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            status: 'active',
            averageRating: 0,
            reviewCount: 0,
        };
        
        set((state) => ({
            listings: [...state.listings, listing],
            myListings: [...state.myListings, listing],
        }));
        
        const state = get();
        localStorage.setItem('row-trader-listings', JSON.stringify(state.listings));
    },
    
    updateListingRating: (listingId) => {
        const reviews = get().reviews.filter(r => {
            const offer = get().offers.find(o => o.id === r.tradeId);
            return offer && get().listings.find(l => l.id === offer.listingId)?.id === listingId;
        });
        
        if (reviews.length > 0) {
            const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            set((state) => ({
                listings: state.listings.map(l =>
                    l.id === listingId
                        ? { ...l, averageRating: average, reviewCount: reviews.length }
                        : l
                ),
            }));
        }
    },
    
    // Gifts
    sendGift: (giftData) => {
        const gift: Gift = {
            ...giftData,
            id: `gift-${Date.now()}`,
            createdAt: Date.now(),
            status: 'pending',
        };
        
        set((state) => ({
            gifts: [...state.gifts, gift],
            receivedGifts: gift.toUserId === get().currentUser?.id
                ? [...state.receivedGifts, gift]
                : state.receivedGifts,
        }));
        
        // Add Rowbucks bonus if included
        if (gift.rowbucksBonus) {
            // Would be added when gift is accepted
        }
        
        const state = get();
        localStorage.setItem('row-trader-gifts', JSON.stringify(state.gifts));
    },
    
    acceptGift: (giftId) => {
        const gift = get().gifts.find(g => g.id === giftId);
        if (!gift) return;
        
        set((state) => ({
            gifts: state.gifts.map(g =>
                g.id === giftId ? { ...g, status: 'accepted' as const } : g
            ),
        }));
        
        if (gift.rowbucksBonus) {
            get().addRowbucks(gift.rowbucksBonus, 'Gift bonus');
        }
    },
    
    declineGift: (giftId) => {
        set((state) => ({
            gifts: state.gifts.map(g =>
                g.id === giftId ? { ...g, status: 'declined' as const } : g
            ),
        }));
    },
    
    // Expert Status
    updateExpertStatus: () => {
        const tradesCompleted = get().offers.filter(o => o.status === 'accepted').length;
        const level = get().getExpertLevel(tradesCompleted);
        const negotiationSkill = get().calculateNegotiationSkill();
        const userRating = get().getUserRating(get().currentUser?.id || '');
        
        const badges: string[] = [];
        if (tradesCompleted >= 10) badges.push('Fair Negotiator');
        if (tradesCompleted >= 25) badges.push('Master Barterer');
        if (userRating.average >= 4.5) badges.push('Trusted Trader');
        
        set({
            expertStatus: {
                level,
                tradesCompleted,
                averageRating: userRating.average,
                totalStars: userRating.count * userRating.average,
                badges,
                negotiationSkill,
            },
        });
        
        const state = get();
        localStorage.setItem('row-trader-expert-status', JSON.stringify(state.expertStatus));
    },
    
    getExpertLevel: (tradesCompleted) => {
        if (tradesCompleted < 6) return 'newbie';
        if (tradesCompleted < 21) return 'bargain-hunter';
        return 'master-barterer';
    },
    
    calculateNegotiationSkill: () => {
        const offers = get().offers;
        const accepted = offers.filter(o => o.status === 'accepted').length;
        const countered = offers.filter(o => o.status === 'countered').length;
        const total = offers.length;
        
        if (total === 0) return 0;
        
        // Skill based on acceptance rate + counter-offer success
        const baseScore = (accepted / total) * 50;
        const counterBonus = (countered / total) * 30;
        const ratingBonus = (get().getUserRating(get().currentUser?.id || '').average / 5) * 20;
        
        return Math.min(100, baseScore + counterBonus + ratingBonus);
    },
    
    // Shared Game Matching (strict)
    getListingsWithSharedGames: () => {
        const currentUser = get().currentUser;
        if (!currentUser) return [];
        
        return get().listings.filter(listing => {
            // In real app, would look up listing owner's favoriteGames
            // For MVP, assume all listings match (simplified)
            return listing.status === 'active';
        }) as EnhancedListing[];
    },
    
    canTradeWithUser: (userId) => {
        const currentUser = get().currentUser;
        if (!currentUser) return false;
        
        // Check if blocked
        if (get().blockedUsers.includes(userId)) return false;
        
        // Check if has shared games (simplified - would look up user's games)
        // For MVP, allow if not blocked
        return true;
    },
}));
