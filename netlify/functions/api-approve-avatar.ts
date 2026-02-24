/**
 * Approve Avatar Function
 * Parent/admin approves child avatar
 */

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
        const { childUserId } = body;
        
        if (!childUserId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'childUserId required' }) };
        }

        const db = getDb();
        
        // Verify user is parent of this child or admin
        const userData = await db`
            SELECT role, parent_email FROM users WHERE id = ${user.id}
        `;
        
        if (userData.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }
        
        const isAdmin = userData[0].role === 'admin';
        const isParent = userData[0].role === 'parent';
        
        if (!isAdmin && !isParent) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Only parents or admins can approve avatars' }) };
        }
        
        // Verify parent relationship (if not admin)
        if (!isAdmin) {
            const childData = await db`
                SELECT parent_email FROM users WHERE id = ${childUserId}
            `;
            
            if (childData.length === 0 || childData[0].parent_email !== user.email) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized to approve this avatar' }) };
            }
        }
        
        // Approve avatar
        await db`
            UPDATE users 
            SET 
                avatar_pending_approval = FALSE,
                updated_at = NOW()
            WHERE id = ${childUserId}
        `;
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Avatar approved successfully!',
            }),
        };
    } catch (error: any) {
        console.error('Error approving avatar:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
