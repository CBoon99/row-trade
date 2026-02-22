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

        const body = JSON.parse(event.body || '{}');
        const { listingId, offering, wanting } = body;

        if (!listingId || !offering || !wanting) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Safety check
        const safetyCheck = checkContentSafety(offering + ' ' + wanting);
        if (!safetyCheck.isSafe) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Content contains prohibited words',
                    violations: safetyCheck.violations,
                }),
            };
        }

        const db = getDb();

        // Get listing and verify it exists and is active
        const listing = await db`
            SELECT user_id, status FROM listings WHERE id = ${listingId}
        `;

        if (!listing[0]) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Listing not found' }) };
        }

        if (listing[0].status !== 'active') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Listing is not active' }) };
        }

        // Check shared games (simplified - would need user lookup)
        // For MVP, allow if not blocked

        // Create offer
        const offerId = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db`
            INSERT INTO offers (
                id, listing_id, from_user_id, to_user_id, offering, wanting, status
            ) VALUES (
                ${offerId},
                ${listingId},
                ${user.id},
                ${listing[0].user_id},
                ${safetyCheck.filteredContent.split(' ')[0] || offering},
                ${wanting},
                'pending'
            )
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                offerId,
            }),
        };
    } catch (error: any) {
        console.error('Error making offer:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
