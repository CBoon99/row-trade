/**
 * Database connection utility
 * Uses Neon serverless driver with Netlify DB
 */

import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
    if (!sql) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        sql = neon(databaseUrl);
    }
    return sql;
}

/**
 * Get current user from Netlify Identity token
 */
export async function getCurrentUser(event: any): Promise<{ id: string; email: string } | null> {
    const clientContext = event.clientContext;
    if (!clientContext || !clientContext.user) {
        return null;
    }
    return {
        id: clientContext.user.sub,
        email: clientContext.user.email,
    };
}

/**
 * Safety check: Verify user owns resource
 */
export async function verifyOwnership(
    userId: string,
    resourceId: string,
    resourceType: 'listing' | 'offer' | 'gift'
): Promise<boolean> {
    const db = getDb();
    
    try {
        if (resourceType === 'listing') {
            const result = await db`
                SELECT user_id FROM listings WHERE id = ${resourceId}
            `;
            return result[0]?.user_id === userId;
        } else if (resourceType === 'offer') {
            const result = await db`
                SELECT from_user_id, to_user_id FROM offers WHERE id = ${resourceId}
            `;
            return result[0]?.from_user_id === userId || result[0]?.to_user_id === userId;
        } else if (resourceType === 'gift') {
            const result = await db`
                SELECT from_user_id, to_user_id FROM gifts WHERE id = ${resourceId}
            `;
            return result[0]?.from_user_id === userId || result[0]?.to_user_id === userId;
        }
        return false;
    } catch (error) {
        console.error('Error verifying ownership:', error);
        return false;
    }
}
