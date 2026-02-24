/**
 * Trading Store with API Backend Sync
 * Extends TradingStoreExtended to sync with Netlify Functions + Neon DB
 */

import { create } from 'zustand';
import { tradingApi } from '../api/tradingApi';
import { authManager } from '../systems/AuthManager';
import { 
    useTradingStoreExtended,
    type Friend, 
    type Review, 
    type ExpertStatus, 
    type EnhancedListing, 
    type Gift,
    type TradingStoreExtended
} from './TradingStoreExtended';

interface TradingStoreWithAPI {
    // Include all base store properties
    currentUser: any;
    availableGames: any[];
    listings: any[];
    myListings: any[];
    offers: any[];
    myOffers: any[];
    receivedOffers: any[];
    messages: any[];
    conversations: { [userId: string]: any[] };
    rowbucks: number;
    rowbucksHistory: any[];
    friends: Friend[];
    friendRequests: any[];
    reviews: Review[];
    userRatings: { [userId: string]: { average: number; count: number } };
    reports: any[];
    parentalControls: any;
    safetyQuizCompleted: boolean;
    blockedUsers: string[];
    expertStatus: ExpertStatus | null;
    gifts: Gift[];
    receivedGifts: Gift[];
    
    // Base actions (delegate to base store)
    setCurrentUser: (user: any) => void;
    updateFavoriteGames: (games: string[]) => void;
    addListing: (listing: any) => void;
    removeListing: (listingId: string) => void;
    makeOffer: (offer: any) => void;
    counterOffer: (offerId: string, newOffering: string, newWanting: string) => void;
    acceptOffer: (offerId: string) => void;
    declineOffer: (offerId: string) => void;
    sendMessage: (message: any) => void;
    getSharedGames: (userId1: string, userId2: string) => string[];
    getMatchScore: (userId1: string, userId2: string) => number;
    addRowbucks: (amount: number, reason: string) => void;
    spendRowbucks: (amount: number, reason: string) => boolean;
    buyRowbucks: (amount: number) => void;
    addFriend: (friendId: string, username: string, favoriteGames: string[]) => void;
    removeFriend: (friendId: string) => void;
    sendFriendRequest: (toUserId: string) => void;
    acceptFriendRequest: (requestId: string) => void;
    getFriendsWithSharedGames: () => Friend[];
    addReview: (review: any) => void;
    getUserRating: (userId: string) => { average: number; count: number };
    submitReport: (report: any) => void;
    setParentalControls: (controls: any) => void;
    completeSafetyQuiz: () => void;
    blockUser: (userId: string) => void;
    checkSafetyViolations: (content: string) => boolean;
    addEnhancedListing: (listing: any) => void;
    updateListingRating: (listingId: string) => void;
    sendGift: (gift: any) => void;
    acceptGift: (giftId: string) => void;
    declineGift: (giftId: string) => void;
    updateExpertStatus: () => void;
    getExpertLevel: (tradesCompleted: number) => 'newbie' | 'bargain-hunter' | 'master-barterer';
    calculateNegotiationSkill: () => number;
    getListingsWithSharedGames: () => EnhancedListing[];
    canTradeWithUser: (userId: string) => boolean;
    // API sync state
    isSyncing: boolean;
    lastSync: number | null;
    
    // API sync actions
    syncListings: () => Promise<void>;
    syncFriends: () => Promise<void>;
    syncUserData: () => Promise<void>;
    
    // Override base actions to use API
    addListingAPI: (listing: Omit<EnhancedListing, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    makeOfferAPI: (offer: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
    acceptOfferAPI: (offerId: string) => Promise<void>;
    addFriendAPI: (friendId: string) => Promise<void>;
    sendGiftAPI: (gift: Omit<Gift, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    addReviewAPI: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
    submitReportAPI: (report: Omit<any, 'id' | 'status' | 'createdAt'>) => Promise<void>;
}

export const useTradingStoreWithAPI = create<TradingStoreWithAPI>((set, get) => {
    // Get base store state and actions
    const baseStore = useTradingStoreExtended.getState();
    
    return {
        // Copy all base state
        currentUser: baseStore.currentUser,
        availableGames: baseStore.availableGames,
        listings: baseStore.listings,
        myListings: baseStore.myListings,
        offers: baseStore.offers,
        myOffers: baseStore.myOffers,
        receivedOffers: baseStore.receivedOffers,
        messages: baseStore.messages,
        conversations: baseStore.conversations,
        rowbucks: baseStore.rowbucks,
        rowbucksHistory: baseStore.rowbucksHistory,
        friends: baseStore.friends,
        friendRequests: baseStore.friendRequests,
        reviews: baseStore.reviews,
        userRatings: baseStore.userRatings,
        reports: baseStore.reports,
        parentalControls: baseStore.parentalControls,
        safetyQuizCompleted: baseStore.safetyQuizCompleted,
        blockedUsers: baseStore.blockedUsers,
        expertStatus: baseStore.expertStatus,
        gifts: baseStore.gifts,
        receivedGifts: baseStore.receivedGifts,
        
        // Delegate base actions
        setCurrentUser: baseStore.setCurrentUser,
        updateFavoriteGames: baseStore.updateFavoriteGames,
        addListing: baseStore.addListing,
        removeListing: baseStore.removeListing,
        makeOffer: baseStore.makeOffer,
        counterOffer: baseStore.counterOffer,
        acceptOffer: baseStore.acceptOffer,
        declineOffer: baseStore.declineOffer,
        sendMessage: baseStore.sendMessage,
        getSharedGames: baseStore.getSharedGames,
        getMatchScore: baseStore.getMatchScore,
        addRowbucks: baseStore.addRowbucks,
        spendRowbucks: baseStore.spendRowbucks,
        buyRowbucks: baseStore.buyRowbucks,
        addFriend: baseStore.addFriend,
        removeFriend: baseStore.removeFriend,
        sendFriendRequest: baseStore.sendFriendRequest,
        acceptFriendRequest: baseStore.acceptFriendRequest,
        getFriendsWithSharedGames: baseStore.getFriendsWithSharedGames,
        addReview: baseStore.addReview,
        getUserRating: baseStore.getUserRating,
        submitReport: baseStore.submitReport,
        setParentalControls: baseStore.setParentalControls,
        completeSafetyQuiz: baseStore.completeSafetyQuiz,
        blockUser: baseStore.blockUser,
        checkSafetyViolations: baseStore.checkSafetyViolations,
        addEnhancedListing: baseStore.addEnhancedListing,
        updateListingRating: baseStore.updateListingRating,
        sendGift: baseStore.sendGift,
        acceptGift: baseStore.acceptGift,
        declineGift: baseStore.declineGift,
        updateExpertStatus: baseStore.updateExpertStatus,
        getExpertLevel: baseStore.getExpertLevel,
        calculateNegotiationSkill: baseStore.calculateNegotiationSkill,
        getListingsWithSharedGames: baseStore.getListingsWithSharedGames,
        canTradeWithUser: baseStore.canTradeWithUser,
        
        // API sync state
        isSyncing: false,
        lastSync: null,
        
        // Sync listings from API
        syncListings: async () => {
            if (!authManager.isAuthenticated()) return;
            
            set({ isSyncing: true });
            try {
                const response = await tradingApi.getMatches();
                // Update base store listings
                useTradingStoreExtended.setState({ listings: response.listings || [] });
                set({
                    lastSync: Date.now(),
                    isSyncing: false,
                });
            } catch (error) {
                console.error('Error syncing listings:', error);
                set({ isSyncing: false });
            }
        },
        
        // Sync friends from API
        syncFriends: async () => {
            if (!authManager.isAuthenticated()) return;
            
            try {
                const response = await tradingApi.getFriends();
                // Update base store friends
                useTradingStoreExtended.setState({ friends: response.friends || [] });
            } catch (error) {
                console.error('Error syncing friends:', error);
            }
        },
        
        // Sync user data
        syncUserData: async () => {
            if (!authManager.isAuthenticated()) return;
            
            // Would fetch user profile, Rowbucks, etc. from API
            // For now, keep localStorage as fallback
        },
        
        // Add listing via API
        addListingAPI: async (listingData) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to create listing');
            }
            
            try {
                const response = await tradingApi.createListing({
                    gameId: listingData.gameId,
                    itemName: listingData.itemName,
                    itemDescription: listingData.itemDescription,
                    itemType: listingData.itemType,
                    listingType: listingData.listingType,
                    wants: listingData.wants,
                    buyNowPrice: listingData.buyNowPrice,
                    openToOffers: listingData.openToOffers,
                    examples: listingData.examples,
                });
                
                // Refresh listings
                await get().syncListings();
            } catch (error) {
                console.error('Error creating listing:', error);
                throw error;
            }
        },
        
        // Make offer via API
        makeOfferAPI: async (offerData) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to make offer');
            }
            
            try {
                await tradingApi.makeOffer({
                    listingId: offerData.listingId,
                    offering: offerData.offering,
                    wanting: offerData.wanting,
                });
                
                // Refresh offers (would need API endpoint)
            } catch (error) {
                console.error('Error making offer:', error);
                throw error;
            }
        },
        
        // Accept offer via API
        acceptOfferAPI: async (offerId: string) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to accept offer');
            }
            
            try {
                const response = await tradingApi.acceptTrade(offerId);
                
                // Update local state
                set((state) => ({
                    offers: state.offers.map(o =>
                        o.id === offerId ? { ...o, status: 'accepted' as const, updatedAt: Date.now() } : o
                    ),
                    rowbucks: state.rowbucks + (response.rowbucksEarned || 0),
                }));
                
                // Update trade streak and generate success story
                const extendedStore = useTradingStoreExtended.getState();
                extendedStore.updateTradeStreak();
                extendedStore.updateExpertStatus();
                
                // Generate success story
                const offer = extendedStore.offers.find(o => o.id === offerId);
                if (offer) {
                    extendedStore.addSuccessStory({
                        story: `A trader successfully completed a trade! They negotiated well and both parties were happy. Great bartering skills!`,
                        tradeType: 'Swap',
                    });
                }
                
                // Refresh listings
                await get().syncListings();
            } catch (error) {
                console.error('Error accepting offer:', error);
                throw error;
            }
        },
        
        // Add friend via API
        addFriendAPI: async (friendId: string) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to add friend');
            }
            
            try {
                await tradingApi.addFriend(friendId);
                await get().syncFriends();
            } catch (error) {
                console.error('Error adding friend:', error);
                throw error;
            }
        },
        
        // Send gift via API
        sendGiftAPI: async (giftData) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to send gift');
            }
            
            try {
                await tradingApi.sendGift({
                    toUserId: giftData.toUserId,
                    itemName: giftData.itemName,
                    itemDescription: giftData.itemDescription,
                    gameId: giftData.gameId,
                    rowbucksBonus: giftData.rowbucksBonus,
                });
                
                // Update Rowbucks if bonus included
                if (giftData.rowbucksBonus) {
                    set((state) => ({
                        rowbucks: state.rowbucks - giftData.rowbucksBonus!,
                    }));
                }
            } catch (error) {
                console.error('Error sending gift:', error);
                throw error;
            }
        },
        
        // Add review via API
        addReviewAPI: async (reviewData) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to add review');
            }
            
            try {
                const response = await tradingApi.addReview({
                    tradeId: reviewData.tradeId,
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                });
                
                // Update Rowbucks
                set((state) => ({
                    rowbucks: state.rowbucks + (response.rowbucksEarned || 2),
                }));
                
                // Update expert status
                get().updateExpertStatus();
            } catch (error) {
                console.error('Error adding review:', error);
                throw error;
            }
        },
        
        // Submit report via API
        submitReportAPI: async (reportData) => {
            if (!authManager.isAuthenticated()) {
                throw new Error('Must be logged in to submit report');
            }
            
            try {
                await tradingApi.submitReport({
                    reportedUserId: reportData.reportedUserId,
                    reportedListingId: reportData.reportedListingId,
                    reportedMessageId: reportData.reportedMessageId,
                    reason: reportData.reason,
                    details: reportData.details,
                });
            } catch (error) {
                console.error('Error submitting report:', error);
                throw error;
            }
        },
    };
});

// Note: This store composes TradingStoreExtended by delegating to it
// All base functionality comes from useTradingStoreExtended
// This store adds API sync methods on top
