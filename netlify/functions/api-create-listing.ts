import { Handler } from '@netlify/functions';
import { getDb, getCurrentUser } from './utils/db';
import { checkContentSafety, validateParentalControls } from './utils/safety';

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
        const {
            gameId,
            itemName,
            itemDescription,
            itemType,
            listingType,
            wants,
            buyNowPrice,
            openToOffers,
            examples,
            photoUrls,
        } = body;

        // Safety check on content
        const safetyCheck = checkContentSafety(itemDescription + ' ' + (wants || ''));
        if (!safetyCheck.isSafe) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Content contains prohibited words',
                    violations: safetyCheck.violations,
                }),
            };
        }

        // Validate parental controls if applicable
        const tradeValue = buyNowPrice || 0;
        const db = getDb();
        const parentalCheck = await validateParentalControls(db, user.id, tradeValue);
        if (!parentalCheck.allowed) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: parentalCheck.reason }),
            };
        }

        // Create listing
        const listingId = `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db`
            INSERT INTO listings (
                id, user_id, game_id, item_name, item_description, item_type,
                listing_type, wants, buy_now_price, open_to_offers, examples, photo_urls, status
            ) VALUES (
                ${listingId},
                ${user.id},
                ${gameId},
                ${safetyCheck.filteredContent.split(' ')[0] || itemName},
                ${safetyCheck.filteredContent},
                ${itemType},
                ${listingType},
                ${wants || null},
                ${buyNowPrice || null},
                ${openToOffers || false},
                ${examples ? JSON.stringify(examples) : null},
                ${photoUrls ? JSON.stringify(photoUrls) : null},
                'active'
            )
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                listingId,
            }),
        };
    } catch (error: any) {
        console.error('Error creating listing:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
