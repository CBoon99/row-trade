/**
 * Admin Function: Get Reports
 * Requires admin role in Netlify Identity
 */

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

        // Check if user is admin
        const clientContext = event.clientContext;
        const isAdmin = clientContext?.user?.app_metadata?.roles?.includes('admin') || false;

        if (!isAdmin) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
        }

        const db = getDb();
        const { status, limit = '50', offset = '0' } = event.queryStringParameters || {};

        // Build query
        let query = db`
            SELECT 
                r.*,
                u_reporter.username as reporter_username,
                u_reporter.email as reporter_email,
                u_reported.username as reported_username,
                u_reported.email as reported_email,
                l.item_name as listing_item_name
            FROM reports r
            LEFT JOIN users u_reporter ON r.reporter_id = u_reporter.id
            LEFT JOIN users u_reported ON r.reported_user_id = u_reported.id
            LEFT JOIN listings l ON r.reported_listing_id = l.id
        `;

        if (status) {
            query = db`
                ${query}
                WHERE r.status = ${status}
            `;
        }

        query = db`
            ${query}
            ORDER BY r.created_at DESC
            LIMIT ${parseInt(limit)}
            OFFSET ${parseInt(offset)}
        `;

        const reports = await query;

        // Get total count
        const countResult = status
            ? await db`SELECT COUNT(*) as count FROM reports WHERE status = ${status}`
            : await db`SELECT COUNT(*) as count FROM reports`;
        const totalCount = parseInt(countResult[0]?.count || '0');

        return {
            statusCode: 200,
            body: JSON.stringify({
                reports: reports.map((r: any) => ({
                    id: r.id,
                    reporterId: r.reporter_id,
                    reporterUsername: r.reporter_username,
                    reporterEmail: r.reporter_email,
                    reportedUserId: r.reported_user_id,
                    reportedUsername: r.reported_username,
                    reportedEmail: r.reported_email,
                    reportedListingId: r.reported_listing_id,
                    listingItemName: r.listing_item_name,
                    reportedMessageId: r.reported_message_id,
                    reason: r.reason,
                    details: r.details,
                    status: r.status,
                    createdAt: r.created_at,
                })),
                totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
            }),
        };
    } catch (error: any) {
        console.error('Error getting reports:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
