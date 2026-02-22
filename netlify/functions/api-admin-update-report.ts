/**
 * Admin Function: Update Report Status
 * Requires admin role in Netlify Identity
 */

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

        // Check if user is admin
        const clientContext = event.clientContext;
        const isAdmin = clientContext?.user?.app_metadata?.roles?.includes('admin') || false;

        if (!isAdmin) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
        }

        const body = JSON.parse(event.body || '{}');
        const { reportId, status, adminNotes } = body;

        if (!reportId || !status) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing reportId or status' }) };
        }

        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid status' }) };
        }

        const db = getDb();

        await db`
            UPDATE reports
            SET status = ${status},
                updated_at = NOW()
            WHERE id = ${reportId}
        `;

        // If resolved and user was reported, could add to blocked users table
        // For now, just update status

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                reportId,
                status,
            }),
        };
    } catch (error: any) {
        console.error('Error updating report:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
