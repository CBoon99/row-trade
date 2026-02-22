import { Game, User } from '../stores/TradingStore';

/**
 * Get shared games between two users
 * @param user1 First user
 * @param user2 Second user
 * @param availableGames List of all available games
 * @returns Array of shared game objects
 */
export function getSharedGames(
    user1: User,
    user2: User,
    availableGames: Game[]
): Game[] {
    if (!user1 || !user2 || !user1.favoriteGames || !user2.favoriteGames) {
        return [];
    }
    
    const sharedGameIds = user1.favoriteGames.filter(gameId =>
        user2.favoriteGames.includes(gameId)
    );
    
    return availableGames.filter(game => sharedGameIds.includes(game.id));
}

/**
 * Get match score (number of shared games)
 * @param user1 First user
 * @param user2 Second user
 * @returns Number of shared games (0 if none)
 */
export function getMatchScore(user1: User, user2: User): number {
    return getSharedGames(user1, user2, []).length;
}

/**
 * Generate smart trade suggestion based on shared games
 * @param user1 First user
 * @param user2 Second user
 * @param availableGames List of all available games
 * @returns Suggestion text
 */
export function generateTradeSuggestion(
    user1: User,
    user2: User,
    availableGames: Game[]
): string {
    const sharedGames = getSharedGames(user1, user2, availableGames);
    
    if (sharedGames.length === 0) {
        return "No shared games - explore different trades!";
    }
    
    if (sharedGames.length === 1) {
        const game = sharedGames[0];
        // Same game - suggest same-game swaps
        if (game.id === 'rowblocks') {
            return "You both play Rowblocks! Trade fish for fish or swap blocks!";
        }
        return `You both play ${game.name}! Trade items from the same game!`;
    }
    
    // Multiple shared games - suggest cross-game trades
    const gameNames = sharedGames.map(g => g.name).join(', ');
    return `You share ${sharedGames.length} games (${gameNames})! Try cross-game trades like fish for bullets!`;
}

/**
 * Generate offer template based on shared games
 * @param user1 First user (offerer)
 * @param user2 Second user (recipient)
 * @param availableGames List of all available games
 * @returns Template object with offering and wanting suggestions
 */
export function generateOfferTemplate(
    user1: User,
    user2: User,
    availableGames: Game[]
): { offering: string; wanting: string } {
    const sharedGames = getSharedGames(user1, user2, availableGames);
    
    if (sharedGames.length === 0) {
        return {
            offering: "My Rowblocks Abyssal Gem",
            wanting: "Your Animal Crossing Star Fragment",
        };
    }
    
    if (sharedGames.length === 1) {
        const game = sharedGames[0];
        if (game.id === 'rowblocks') {
            return {
                offering: "My Rowblocks Fish",
                wanting: "Your Rowblocks Fish",
            };
        }
        return {
            offering: `My ${game.name} Item`,
            wanting: `Your ${game.name} Item`,
        };
    }
    
    // Multiple games - suggest cross-game trade
    const game1 = sharedGames[0];
    const game2 = sharedGames[1];
    
    if (game1.id === 'rowblocks') {
        return {
            offering: "My Rowblocks Fish",
            wanting: `Your ${game2.name} Item`,
        };
    }
    
    return {
        offering: `My ${game1.name} Item`,
        wanting: `Your ${game2.name} Item`,
    };
}
