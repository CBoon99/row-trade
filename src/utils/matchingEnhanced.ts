/**
 * Enhanced Matching System
 * Calculates compatibility scores and match percentages
 */

import { User, Game } from '../stores/TradingStore';
import { MatchScore } from '../stores/TradingStoreExtended';

/**
 * Calculate match score between two users
 */
export function calculateMatchScore(
    user1: User,
    user2: User,
    availableGames: Game[],
    user2Rating?: { average: number; count: number }
): MatchScore | null {
    const sharedGameIds = user1.favoriteGames.filter(gameId =>
        user2.favoriteGames.includes(gameId)
    );
    
    if (sharedGameIds.length === 0) {
        return null; // No shared games = no match
    }
    
    const sharedGames = availableGames.filter(game => sharedGameIds.includes(game.id));
    
    // Calculate match percentage
    const totalUniqueGames = new Set([...user1.favoriteGames, ...user2.favoriteGames]).size;
    const matchPercentage = Math.round((sharedGameIds.length / totalUniqueGames) * 100);
    
    // Calculate compatibility score (0-100)
    // Base: match percentage (0-80 points)
    // Bonus: rating (0-20 points)
    const baseScore = Math.min(80, matchPercentage);
    const ratingBonus = user2Rating 
        ? (user2Rating.average / 5) * 20 
        : 0;
    const compatibilityScore = Math.min(100, Math.round(baseScore + ratingBonus));
    
    return {
        userId: user2.id,
        username: user2.username,
        sharedGames: sharedGames.map(g => g.name),
        sharedGamesCount: sharedGames.length,
        compatibilityScore,
        matchPercentage,
    };
}

/**
 * Get sorted matches for a user
 */
export function getSortedMatches(
    currentUser: User,
    allUsers: User[],
    availableGames: Game[],
    getUserRating: (userId: string) => { average: number; count: number }
): MatchScore[] {
    const matches: MatchScore[] = [];
    
    for (const user of allUsers) {
        if (user.id === currentUser.id) continue;
        
        const rating = getUserRating(user.id);
        const match = calculateMatchScore(currentUser, user, availableGames, rating);
        
        if (match && rating.average >= 3.0) { // Only show users with 3+ star average
            matches.push(match);
        }
    }
    
    // Sort by compatibility score (highest first)
    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/**
 * Generate match suggestion text
 */
export function generateMatchSuggestion(match: MatchScore): string {
    if (match.sharedGamesCount === 1) {
        return `Perfect match! You both play ${match.sharedGames[0]}!`;
    } else if (match.sharedGamesCount <= 3) {
        return `${match.matchPercentage}% match - ${match.sharedGamesCount} shared games: ${match.sharedGames.join(', ')}`;
    } else {
        return `${match.matchPercentage}% match - ${match.sharedGamesCount} shared games! Great for cross-game trades!`;
    }
}
