import { create } from 'zustand';

export interface Game {
    id: string;
    name: string;
    icon?: string;
}

export interface User {
    id: string;
    username: string;
    favoriteGames: string[]; // Game IDs
    avatar?: string;
}

export interface Listing {
    id: string;
    userId: string;
    gameId: string; // Which game the item is from
    itemName: string;
    itemDescription: string;
    itemType: 'block' | 'fish' | 'gem' | 'skin' | 'other';
    wants: string; // What they want in return
    createdAt: number;
    status: 'active' | 'traded' | 'cancelled';
}

export interface Offer {
    id: string;
    listingId: string;
    fromUserId: string;
    toUserId: string;
    offering: string; // What they're offering
    wanting: string; // What they want
    status: 'pending' | 'countered' | 'accepted' | 'declined';
    counterOffer?: Offer; // If countered, link to counter
    createdAt: number;
    updatedAt: number;
}

export interface Message {
    id: string;
    conversationId: string;
    fromUserId: string;
    toUserId: string;
    content: string;
    offerId?: string; // If message is about an offer
    createdAt: number;
}

interface TradingStore {
    // Users & Games
    currentUser: User | null;
    availableGames: Game[];
    
    // Listings
    listings: Listing[];
    myListings: Listing[];
    
    // Offers
    offers: Offer[];
    myOffers: Offer[];
    receivedOffers: Offer[];
    
    // Messages
    messages: Message[];
    conversations: { [userId: string]: Message[] };
    
    // Actions
    setCurrentUser: (user: User) => void;
    updateFavoriteGames: (games: string[]) => void;
    addListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'status'>) => void;
    removeListing: (listingId: string) => void;
    makeOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
    counterOffer: (offerId: string, newOffering: string, newWanting: string) => void;
    acceptOffer: (offerId: string) => void;
    declineOffer: (offerId: string) => void;
    sendMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
    getSharedGames: (userId1: string, userId2: string) => string[];
    getMatchScore: (userId1: string, userId2: string) => number;
}

const DEFAULT_GAMES: Game[] = [
    { id: 'rowblocks', name: 'Rowblocks' },
    { id: 'animal-crossing', name: 'Animal Crossing' },
    { id: 'fortnite', name: 'Fortnite' },
    { id: 'roblox', name: 'Roblox' },
    { id: 'minecraft', name: 'Minecraft' },
    { id: 'call-of-duty', name: 'Call of Duty' },
    { id: 'among-us', name: 'Among Us' },
    { id: 'genshin-impact', name: 'Genshin Impact' },
    { id: 'pokemon-go', name: 'Pokemon GO' },
    { id: 'stardew-valley', name: 'Stardew Valley' },
];

export const useTradingStore = create<TradingStore>((set, get) => ({
    // Initial state
    currentUser: null,
    availableGames: DEFAULT_GAMES,
    listings: [],
    myListings: [],
    offers: [],
    myOffers: [],
    receivedOffers: [],
    messages: [],
    conversations: {},
    
    // Set current user
    setCurrentUser: (user) => {
        set({ currentUser: user });
        // Load user's listings and offers
        const myListings = get().listings.filter(l => l.userId === user.id);
        const myOffers = get().offers.filter(o => o.fromUserId === user.id);
        const receivedOffers = get().offers.filter(o => o.toUserId === user.id);
        set({ myListings, myOffers, receivedOffers });
    },
    
    // Update favorite games
    updateFavoriteGames: (games) => {
        const user = get().currentUser;
        if (user) {
            set({
                currentUser: { ...user, favoriteGames: games }
            });
            // Save to localStorage
            localStorage.setItem('row-trader-user', JSON.stringify({ ...user, favoriteGames: games }));
        }
    },
    
    // Add listing
    addListing: (listingData) => {
        const listing: Listing = {
            ...listingData,
            id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            status: 'active',
        };
        set((state) => ({
            listings: [...state.listings, listing],
            myListings: [...state.myListings, listing],
        }));
        // Save to localStorage
        const listings = [...get().listings, listing];
        localStorage.setItem('row-trader-listings', JSON.stringify(listings));
    },
    
    // Remove listing
    removeListing: (listingId) => {
        set((state) => ({
            listings: state.listings.filter(l => l.id !== listingId),
            myListings: state.myListings.filter(l => l.id !== listingId),
        }));
        const listings = get().listings.filter(l => l.id !== listingId);
        localStorage.setItem('row-trader-listings', JSON.stringify(listings));
    },
    
    // Make offer
    makeOffer: (offerData) => {
        const offer: Offer = {
            ...offerData,
            id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'pending',
        };
        set((state) => ({
            offers: [...state.offers, offer],
            myOffers: [...state.myOffers, offer],
        }));
        // Save to localStorage
        const offers = [...get().offers, offer];
        localStorage.setItem('row-trader-offers', JSON.stringify(offers));
    },
    
    // Counter offer
    counterOffer: (offerId, newOffering, newWanting) => {
        const originalOffer = get().offers.find(o => o.id === offerId);
        if (!originalOffer) return;
        
        const counter: Offer = {
            id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            listingId: originalOffer.listingId,
            fromUserId: originalOffer.toUserId, // Counter comes from recipient
            toUserId: originalOffer.fromUserId,
            offering: newOffering,
            wanting: newWanting,
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        
        set((state) => ({
            offers: state.offers.map(o => 
                o.id === offerId ? { ...o, status: 'countered' as const, counterOffer: counter } : o
            ).concat(counter),
        }));
        
        const offers = get().offers.map(o => 
            o.id === offerId ? { ...o, status: 'countered' as const, counterOffer: counter } : o
        ).concat(counter);
        localStorage.setItem('row-trader-offers', JSON.stringify(offers));
    },
    
    // Accept offer
    acceptOffer: (offerId) => {
        set((state) => ({
            offers: state.offers.map(o => 
                o.id === offerId ? { ...o, status: 'accepted' as const, updatedAt: Date.now() } : o
            ),
            listings: state.listings.map(l => {
                const offer = state.offers.find(o => o.id === offerId);
                return offer && l.id === offer.listingId ? { ...l, status: 'traded' as const } : l;
            }),
        }));
        const offers = get().offers.map(o => 
            o.id === offerId ? { ...o, status: 'accepted' as const, updatedAt: Date.now() } : o
        );
        localStorage.setItem('row-trader-offers', JSON.stringify(offers));
    },
    
    // Decline offer
    declineOffer: (offerId) => {
        set((state) => ({
            offers: state.offers.map(o => 
                o.id === offerId ? { ...o, status: 'declined' as const, updatedAt: Date.now() } : o
            ),
        }));
        const offers = get().offers.map(o => 
            o.id === offerId ? { ...o, status: 'declined' as const, updatedAt: Date.now() } : o
        );
        localStorage.setItem('row-trader-offers', JSON.stringify(offers));
    },
    
    // Send message
    sendMessage: (messageData) => {
        const message: Message = {
            ...messageData,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
        };
        
        set((state) => {
            const conversationId = messageData.conversationId;
            const existing = state.conversations[conversationId] || [];
            return {
                messages: [...state.messages, message],
                conversations: {
                    ...state.conversations,
                    [conversationId]: [...existing, message],
                },
            };
        });
        
        // Save to localStorage
        const messages = [...get().messages, message];
        localStorage.setItem('row-trader-messages', JSON.stringify(messages));
    },
    
    // Get shared games between two users
    getSharedGames: (userId1, userId2) => {
        const users = get().listings.map(l => ({ id: l.userId })); // Simplified - in real app, would have user store
        // For MVP, get from listings or current user
        const user1 = userId1 === get().currentUser?.id ? get().currentUser : null;
        const user2 = userId2 === get().currentUser?.id ? get().currentUser : null;
        
        if (!user1 || !user2) return [];
        
        return user1.favoriteGames.filter(gameId => 
            user2.favoriteGames.includes(gameId)
        );
    },
    
    // Get match score (number of shared games)
    getMatchScore: (userId1, userId2) => {
        return get().getSharedGames(userId1, userId2).length;
    },
}));
