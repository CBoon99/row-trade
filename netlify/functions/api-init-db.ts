/**
 * Initialize Database Schema
 * Run this once to create all tables
 * Call: GET /.netlify/functions/api-init-db
 */

import { Handler } from '@netlify/functions';
import { getDb } from './utils/db';
import { initializeSchema } from './db-schema';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const db = getDb();
        await initializeSchema(db);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Database schema initialized successfully',
            }),
        };
    } catch (error: any) {
        console.error('Error initializing database:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
