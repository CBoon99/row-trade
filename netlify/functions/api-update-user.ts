import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const body = JSON.parse(event.body || '{}');
        const { username, favoriteGames, safetyQuizCompleted } = body;

        const db = getDb();

        const updates: any = {};
        if (username) updates.username = username;
        if (favoriteGames) updates.favorite_games = favoriteGames;
        if (safetyQuizCompleted !== undefined) updates.safety_quiz_completed = safetyQuizCompleted;
        updates.updated_at = new Date();

        if (Object.keys(updates).length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No fields to update' }) };
        }

        // Build dynamic update query
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
        const values = Object.values(updates);

        await db`
            UPDATE users
            SET ${db.unsafe(setClause)}
            WHERE id = ${user.id}
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
