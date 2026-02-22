import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser, verifyOwnership } from './utils/db';

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
        const { offerId } = body;

        if (!offerId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing offerId' }) };
        }

        const db = getDb();

        // Verify ownership
        const ownsOffer = await verifyOwnership(user.id, offerId, 'offer');
        if (!ownsOffer) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized' }) };
        }

        // Get offer
        const offer = await db`
            SELECT listing_id, from_user_id, to_user_id FROM offers WHERE id = ${offerId}
        `;

        if (!offer[0]) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Offer not found' }) };
        }

        // Update offer status
        await db`
            UPDATE offers
            SET status = 'accepted', updated_at = NOW()
            WHERE id = ${offerId}
        `;

        // Update listing status
        await db`
            UPDATE listings
            SET status = 'traded', updated_at = NOW()
            WHERE id = ${offer[0].listing_id}
        `;

        // Award Rowbucks to both users (1-5 each for fair trade)
        const rowbucksEarned = 3; // Base amount
        
        await db`
            INSERT INTO rowbucks_history (id, user_id, type, amount, reason)
            VALUES (
                ${`rb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`},
                ${offer[0].from_user_id},
                'earn',
                ${rowbucksEarned},
                'Trade completed'
            )
        `;

        await db`
            INSERT INTO rowbucks_history (id, user_id, type, amount, reason)
            VALUES (
                ${`rb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`},
                ${offer[0].to_user_id},
                'earn',
                ${rowbucksEarned},
                'Trade completed'
            )
        `;

        // Update user Rowbucks
        await db`
            UPDATE users
            SET rowbucks = rowbucks + ${rowbucksEarned}
            WHERE id IN (${offer[0].from_user_id}, ${offer[0].to_user_id})
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                rowbucksEarned,
            }),
        };
    } catch (error: any) {
        console.error('Error accepting trade:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
