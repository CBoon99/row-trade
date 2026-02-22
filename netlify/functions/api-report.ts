import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';
import { checkContentSafety, shouldAutoFlag } from './utils/safety';

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
        const { reportedUserId, reportedListingId, reportedMessageId, reason, details } = body;

        if (!reason || !details) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Safety check on report details
        const safetyCheck = checkContentSafety(details);
        
        const db = getDb();

        // Create report
        const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db`
            INSERT INTO reports (
                id, reporter_id, reported_user_id, reported_listing_id, reported_message_id,
                reason, details, status
            ) VALUES (
                ${reportId},
                ${user.id},
                ${reportedUserId || null},
                ${reportedListingId || null},
                ${reportedMessageId || null},
                ${reason},
                ${safetyCheck.filteredContent},
                'pending'
            )
        `;

        // Check if reported user should be auto-flagged
        if (reportedUserId) {
            const autoFlag = await shouldAutoFlag(db, reportedUserId);
            if (autoFlag) {
                // In production, would add to blocked users or send admin alert
                console.warn(`⚠️ Auto-flag user ${reportedUserId} - multiple reports`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                reportId,
                message: 'Report submitted. Thank you for keeping Row-Trader safe!',
            }),
        };
    } catch (error: any) {
        console.error('Error submitting report:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
