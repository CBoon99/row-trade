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
        const { tradeId, rating, comment } = body;

        if (!tradeId || !rating || !comment) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        if (rating < 1 || rating > 5) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Rating must be 1-5' }) };
        }

        const db = getDb();

        // Get trade to find the other user
        const trade = await db`
            SELECT from_user_id, to_user_id, listing_id FROM offers WHERE id = ${tradeId} AND status = 'accepted'
        `;

        if (!trade[0]) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Trade not found or not completed' }) };
        }

        const toUserId = trade[0].from_user_id === user.id ? trade[0].to_user_id : trade[0].from_user_id;

        // Check if review already exists
        const existing = await db`
            SELECT id FROM reviews WHERE trade_id = ${tradeId} AND from_user_id = ${user.id}
        `;

        if (existing[0]) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Review already submitted' }) };
        }

        // Create review
        const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db`
            INSERT INTO reviews (id, trade_id, from_user_id, to_user_id, rating, comment)
            VALUES (${reviewId}, ${tradeId}, ${user.id}, ${toUserId}, ${rating}, ${comment})
        `;

        // Update listing rating
        const listingReviews = await db`
            SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count
            FROM reviews r
            JOIN offers o ON r.trade_id = o.id
            WHERE o.listing_id = ${trade[0].listing_id}
        `;

        await db`
            UPDATE listings
            SET average_rating = ${listingReviews[0]?.avg_rating || 0},
                review_count = ${listingReviews[0]?.count || 0},
                updated_at = NOW()
            WHERE id = ${trade[0].listing_id}
        `;

        // Award Rowbucks for leaving review
        await db`
            UPDATE users
            SET rowbucks = rowbucks + 2
            WHERE id = ${user.id}
        `;

        await db`
            INSERT INTO rowbucks_history (id, user_id, type, amount, reason)
            VALUES (
                ${`rb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`},
                ${user.id},
                'earn',
                2,
                'Left review'
            )
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                reviewId,
                rowbucksEarned: 2,
            }),
        };
    } catch (error: any) {
        console.error('Error adding review:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
