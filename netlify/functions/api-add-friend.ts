import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const body = JSON.parse(event.body || '{}');
        const { friendId } = body;

        if (!friendId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing friendId' }) };
        }

        if (friendId === user.id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Cannot add yourself' }) };
        }

        const db = getDb();

        // Check if friend exists
        const friend = await db`
            SELECT id, favorite_games FROM users WHERE id = ${friendId}
        `;

        if (!friend[0]) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        // Check if already friends
        const existing = await db`
            SELECT id FROM friends
            WHERE (user_id = ${user.id} AND friend_id = ${friendId})
            OR (user_id = ${friendId} AND friend_id = ${user.id})
        `;

        if (existing[0]) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Already friends or request pending' }) };
        }

        // Check shared games
        const currentUser = await db`
            SELECT favorite_games FROM users WHERE id = ${user.id}
        `;
        const userGames = currentUser[0]?.favorite_games || [];
        const friendGames = friend[0].favorite_games || [];
        const sharedGames = userGames.filter((g: string) => friendGames.includes(g));

        if (sharedGames.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No shared games - add friends who play your games!' }),
            };
        }

        // Create friend request
        const friendRequestId = `friend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db`
            INSERT INTO friends (id, user_id, friend_id, status)
            VALUES (${friendRequestId}, ${user.id}, ${friendId}, 'pending')
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                friendRequestId,
                sharedGamesCount: sharedGames.length,
            }),
        };
    } catch (error: any) {
        console.error('Error adding friend:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
