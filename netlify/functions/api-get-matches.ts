import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const db = getDb();

        // Get current user's favorite games
        const currentUser = await db`
            SELECT favorite_games FROM users WHERE id = ${user.id}
        `;

        if (!currentUser[0]) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        const userGames = currentUser[0].favorite_games || [];

        if (userGames.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ listings: [], message: 'Add favorite games to see matches' }),
            };
        }

        // Get listings from users who share at least one game
        // This is a simplified query - in production, would need proper array intersection
        const listings = await db`
            SELECT 
                l.*,
                u.username,
                u.favorite_games,
                (
                    SELECT AVG(rating)::numeric(3,2)
                    FROM reviews r
                    WHERE r.to_user_id = l.user_id
                ) as user_rating,
                (
                    SELECT COUNT(*)
                    FROM reviews r
                    WHERE r.to_user_id = l.user_id
                ) as user_review_count
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active'
            AND l.user_id != ${user.id}
            AND u.favorite_games && ${userGames}::text[]
            ORDER BY l.created_at DESC
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                listings: listings.map((l: any) => ({
                    id: l.id,
                    userId: l.user_id,
                    username: l.username,
                    gameId: l.game_id,
                    itemName: l.item_name,
                    itemDescription: l.item_description,
                    itemType: l.item_type,
                    listingType: l.listing_type,
                    wants: l.wants,
                    buyNowPrice: l.buy_now_price,
                    openToOffers: l.open_to_offers,
                    examples: l.examples,
                    averageRating: l.average_rating,
                    reviewCount: l.review_count,
                    userRating: l.user_rating,
                    userReviewCount: l.user_review_count,
                    createdAt: l.created_at,
                })),
            }),
        };
    } catch (error: any) {
        console.error('Error getting matches:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
