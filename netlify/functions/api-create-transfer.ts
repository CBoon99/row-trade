/**
 * Create Transfer Escrow Function
 * Sets up secure transfer with codes
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
        const { offerId, transferCode } = body;

        if (!offerId || !transferCode) {
            return { statusCode: 400, body: JSON.stringify({ error: 'offerId and transferCode required' }) };
        }

        const db = getDb();

        // Verify offer exists and user is part of it
        const offer = await db`
            SELECT from_user_id, to_user_id, status FROM offers WHERE id = ${offerId}
        `;

        if (offer.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Offer not found' }) };
        }

        if (offer[0].status !== 'accepted') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Offer must be accepted to create transfer' }) };
        }

        const isFromUser = offer[0].from_user_id === user.id;
        const isToUser = offer[0].to_user_id === user.id;

        if (!isFromUser && !isToUser) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized' }) };
        }

        // Check if transfer already exists
        const existing = await db`
            SELECT transfer_code_from, transfer_code_to FROM offers WHERE id = ${offerId}
        `;

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        if (isFromUser) {
            // From user - set their code
            await db`
                UPDATE offers 
                SET 
                    transfer_code_from = ${transferCode},
                    status = 'transfer_pending',
                    transfer_expires_at = ${expiresAt.toISOString()},
                    updated_at = NOW()
                WHERE id = ${offerId}
            `;
        } else {
            // To user - set their code
            await db`
                UPDATE offers 
                SET 
                    transfer_code_to = ${transferCode},
                    status = 'transfer_pending',
                    transfer_expires_at = ${expiresAt.toISOString()},
                    updated_at = NOW()
                WHERE id = ${offerId}
            `;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                codeFrom: isFromUser ? transferCode : existing[0]?.transfer_code_from,
                codeTo: isToUser ? transferCode : existing[0]?.transfer_code_to,
                expiresAt: expiresAt.getTime(),
            }),
        };
    } catch (error: any) {
        console.error('Error creating transfer:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
