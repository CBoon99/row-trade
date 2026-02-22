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
        const { toUserId, itemName, itemDescription, gameId, rowbucksBonus } = body;

        if (!toUserId || !itemName || !itemDescription || !gameId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Safety check
        const safetyCheck = checkContentSafety(itemDescription);
        if (!safetyCheck.isSafe) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Content contains prohibited words',
                    violations: safetyCheck.violations,
                }),
            };
        }

        // Validate parental controls if gifting Rowbucks
        const db = getDb();
        if (rowbucksBonus && rowbucksBonus > 0) {
            const parentalCheck = await validateParentalControls(db, user.id, rowbucksBonus);
            if (!parentalCheck.allowed) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: parentalCheck.reason }),
                };
            }

            // Check if user has enough Rowbucks
            const currentUser = await db`
                SELECT rowbucks FROM users WHERE id = ${user.id}
            `;
            if (!currentUser[0] || currentUser[0].rowbucks < rowbucksBonus) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Not enough Rowbucks' }),
                };
            }
        }

        // Create gift
        const giftId = `gift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db`
            INSERT INTO gifts (
                id, from_user_id, to_user_id, item_name, item_description, game_id, rowbucks_bonus, status
            ) VALUES (
                ${giftId},
                ${user.id},
                ${toUserId},
                ${itemName},
                ${safetyCheck.filteredContent},
                ${gameId},
                ${rowbucksBonus || 0},
                'pending'
            )
        `;

        // Deduct Rowbucks if bonus included
        if (rowbucksBonus && rowbucksBonus > 0) {
            await db`
                UPDATE users
                SET rowbucks = rowbucks - ${rowbucksBonus}
                WHERE id = ${user.id}
            `;

            await db`
                INSERT INTO rowbucks_history (id, user_id, type, amount, reason)
                VALUES (
                    ${`rb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`},
                    ${user.id},
                    'spend',
                    ${rowbucksBonus},
                    'Gift bonus'
                )
            `;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                giftId,
            }),
        };
    } catch (error: any) {
        console.error('Error sending gift:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
