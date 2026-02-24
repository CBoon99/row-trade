/**
 * Admin Function: Ban User
 * Requires admin role in Netlify Identity
 */

import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';

export const handler: Handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // Get authenticated user
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
        const { userId, reason, duration } = body; // duration in days, null = permanent

        if (!userId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'User ID required' }) };
        }

        const db = getDb();

        // Update user to banned
        const banUntil = duration 
            ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
            : null;

        await db`
            UPDATE users 
            SET 
                banned = true,
                banned_until = ${banUntil},
                ban_reason = ${reason || 'Admin ban'},
                updated_at = NOW()
            WHERE id = ${userId}
        `;

        // Log ban action (if table exists)
        try {
            await db`
                INSERT INTO admin_actions (id, admin_id, action_type, target_user_id, details, created_at)
                VALUES (${`action-${Date.now()}`}, ${user.id}, 'ban', ${userId}, ${JSON.stringify({ reason, duration })}::jsonb, NOW())
            `;
        } catch (error) {
            // Table might not exist yet, log but don't fail
            console.warn('Could not log admin action:', error);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: `User ${userId} banned${duration ? ` for ${duration} days` : ' permanently'}` 
            }),
        };
    } catch (error: any) {
        console.error('Error banning user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
