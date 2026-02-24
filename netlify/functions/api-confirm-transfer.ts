/**
 * Confirm Transfer Function
 * Confirms receipt of item in escrow
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
        const { offerId, side } = body; // side: 'from' | 'to'

        if (!offerId || !side) {
            return { statusCode: 400, body: JSON.stringify({ error: 'offerId and side required' }) };
        }

        const db = getDb();

        // Get offer
        const offer = await db`
            SELECT from_user_id, to_user_id, transfer_confirmed_from, transfer_confirmed_to, transfer_expires_at
            FROM offers WHERE id = ${offerId}
        `;

        if (offer.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Offer not found' }) };
        }

        const isFromUser = offer[0].from_user_id === user.id;
        const isToUser = offer[0].to_user_id === user.id;

        if (!isFromUser && !isToUser) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized' }) };
        }

        // Verify side matches user
        if ((side === 'from' && !isFromUser) || (side === 'to' && !isToUser)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid side for user' }) };
        }

        // Update confirmation
        const updateField = side === 'from' ? 'transfer_confirmed_from' : 'transfer_confirmed_to';
        await db`
            UPDATE offers 
            SET 
                ${db.raw(updateField)} = TRUE,
                updated_at = NOW()
            WHERE id = ${offerId}
        `;

        // Check if both confirmed
        const updated = await db`
            SELECT transfer_confirmed_from, transfer_confirmed_to FROM offers WHERE id = ${offerId}
        `;

        if (updated[0].transfer_confirmed_from && updated[0].transfer_confirmed_to) {
            // Both confirmed - complete transfer
            await db`
                UPDATE offers 
                SET 
                    status = 'completed',
                    updated_at = NOW()
                WHERE id = ${offerId}
            `;

            // Award Rowbucks to both users
            await db`
                INSERT INTO rowbucks_history (id, user_id, type, amount, reason, created_at)
                VALUES 
                    (${`rb-${Date.now()}-1`}, ${offer[0].from_user_id}, 'earn', 3, 'Trade completed', NOW()),
                    (${`rb-${Date.now()}-2`}, ${offer[0].to_user_id}, 'earn', 3, 'Trade completed', NOW())
            `;

            // Update user Rowbucks
            await db`
                UPDATE users SET rowbucks = rowbucks + 3 WHERE id = ${offer[0].from_user_id}
            `;
            await db`
                UPDATE users SET rowbucks = rowbucks + 3 WHERE id = ${offer[0].to_user_id}
            `;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Transfer confirmed',
                completed: updated[0].transfer_confirmed_from && updated[0].transfer_confirmed_to,
            }),
        };
    } catch (error: any) {
        console.error('Error confirming transfer:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
