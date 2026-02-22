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

        const userData = await db`
            SELECT 
                id,
                email,
                username,
                role,
                parent_email,
                rowbucks,
                favorite_games,
                safety_quiz_completed,
                (
                    SELECT AVG(rating)::numeric(3,2)
                    FROM reviews r
                    WHERE r.to_user_id = users.id
                ) as average_rating,
                (
                    SELECT COUNT(*)
                    FROM reviews r
                    WHERE r.to_user_id = users.id
                ) as review_count,
                (
                    SELECT COUNT(*)
                    FROM offers o
                    WHERE o.status = 'accepted'
                    AND (o.from_user_id = users.id OR o.to_user_id = users.id)
                ) as trades_completed
            FROM users
            WHERE id = ${user.id}
        `;

        if (!userData[0]) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                user: {
                    id: userData[0].id,
                    email: userData[0].email,
                    username: userData[0].username,
                    role: userData[0].role,
                    parentEmail: userData[0].parent_email,
                    rowbucks: userData[0].rowbucks,
                    favoriteGames: userData[0].favorite_games || [],
                    safetyQuizCompleted: userData[0].safety_quiz_completed,
                    averageRating: userData[0].average_rating || 0,
                    reviewCount: userData[0].review_count || 0,
                    tradesCompleted: userData[0].trades_completed || 0,
                },
            }),
        };
    } catch (error: any) {
        console.error('Error getting user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
