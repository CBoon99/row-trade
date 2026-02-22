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

        // Get accepted friends
        const friends = await db`
            SELECT 
                f.id,
                f.friend_id,
                f.status,
                u.username,
                u.favorite_games,
                u.rowbucks,
                (
                    SELECT AVG(rating)::numeric(3,2)
                    FROM reviews r
                    WHERE r.to_user_id = u.id
                ) as rating,
                (
                    SELECT COUNT(*)
                    FROM reviews r
                    WHERE r.to_user_id = u.id
                ) as review_count
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ${user.id}
            AND f.status = 'accepted'
            ORDER BY f.created_at DESC
        `;

        // Calculate shared games for each friend
        const currentUser = await db`
            SELECT favorite_games FROM users WHERE id = ${user.id}
        `;
        const userGames = currentUser[0]?.favorite_games || [];

        const friendsWithSharedGames = friends.map((f: any) => {
            const friendGames = f.favorite_games || [];
            const sharedGames = userGames.filter((g: string) => friendGames.includes(g));
            
            return {
                id: f.friend_id,
                username: f.username,
                favoriteGames: friendGames,
                sharedGamesCount: sharedGames.length,
                sharedGames: sharedGames,
                rowbucks: f.rowbucks,
                rating: f.rating,
                reviewCount: f.review_count,
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                friends: friendsWithSharedGames,
            }),
        };
    } catch (error: any) {
        console.error('Error getting friends:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
