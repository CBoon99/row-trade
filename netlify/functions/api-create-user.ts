import { Handler } from '@netlify/functions';
import { getDb } from './utils/db';
import { initializeSchema } from '../db-schema';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // This is called after Netlify Identity creates the user
        // The user ID comes from Netlify Identity (JWT sub claim)
        const body = JSON.parse(event.body || '{}');
        const { userId, email, username, role, parentEmail } = body;

        if (!userId || !email || !username) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        const db = getDb();

        // Initialize schema if needed (first run)
        try {
            await initializeSchema(db);
        } catch (e) {
            // Schema might already exist, continue
        }

        // Check if user already exists
        const existing = await db`
            SELECT id FROM users WHERE id = ${userId}
        `;

        if (existing[0]) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'User already exists' }),
            };
        }

        // Create user
        await db`
            INSERT INTO users (
                id, email, username, role, parent_email, rowbucks, favorite_games, safety_quiz_completed
            ) VALUES (
                ${userId},
                ${email},
                ${username},
                ${role || 'child'},
                ${parentEmail || null},
                0,
                '{}',
                FALSE
            )
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, userId }),
        };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
