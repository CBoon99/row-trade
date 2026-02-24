/**
 * Upload Avatar Function
 * Handles avatar uploads to Netlify Blobs with parent approval for child accounts
 */

import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';
import { checkContentSafety } from './utils/safety';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const db = getDb();
        
        // Get user role
        const userData = await db`
            SELECT role, parent_email FROM users WHERE id = ${user.id}
        `;
        
        if (userData.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }
        
        const userRole = userData[0].role;
        const isChild = userRole === 'child';
        
        // Parse request (could be FormData or JSON)
        let avatarUrl: string;
        let pendingApproval = false;
        
        if (event.headers['content-type']?.includes('multipart/form-data')) {
            // Handle file upload (would need multipart parser - for MVP, use JSON with data URL)
            return { statusCode: 400, body: JSON.stringify({ error: 'File upload not yet supported - use template or data URL' }) };
        } else {
            // JSON request with avatarUrl
            const body = JSON.parse(event.body || '{}');
            avatarUrl = body.avatarUrl;
            
            if (!avatarUrl) {
                return { statusCode: 400, body: JSON.stringify({ error: 'avatarUrl required' }) };
            }
            
            // Safety check: Ensure it's a data URL or approved domain
            if (!avatarUrl.startsWith('data:') && !avatarUrl.includes('netlify.app')) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid avatar URL - must be data URL or Netlify Blob' }) };
            }
            
            // Child accounts require parent approval
            if (isChild) {
                pendingApproval = true;
            }
        }
        
        // Update user avatar
        await db`
            UPDATE users 
            SET 
                avatar_url = ${avatarUrl},
                avatar_pending_approval = ${pendingApproval},
                updated_at = NOW()
            WHERE id = ${user.id}
        `;
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                avatarUrl,
                pendingApproval,
                message: isChild 
                    ? 'Avatar uploaded! Waiting for parent approval.'
                    : 'Avatar updated successfully!',
            }),
        };
    } catch (error: any) {
        console.error('Error uploading avatar:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
