/**
 * Server-side safety checks
 * Enforces safety rules on all operations
 */

const BLOCKED_WORDS = [
    'meet', 'irl', 'real life', 'address', 'phone', 'email',
    'password', 'personal info', 'outside', 'external',
    'home', 'location', 'where do you live',
];

const SUSPICIOUS_PATTERNS = [
    /meet\s+(up|me|in|at)/i,
    /outside\s+(the|of|app)/i,
    /real\s+life/i,
    /give\s+me\s+(your|ur)\s+(email|phone|address)/i,
    /contact\s+(me|you)\s+(outside|offline)/i,
];

export interface SafetyCheckResult {
    isSafe: boolean;
    violations: string[];
    filteredContent: string;
}

/**
 * Check content for safety violations
 */
export function checkContentSafety(content: string): SafetyCheckResult {
    const violations: string[] = [];
    let filteredContent = content;
    
    // Check for blocked words
    const lowerContent = content.toLowerCase();
    for (const word of BLOCKED_WORDS) {
        if (lowerContent.includes(word)) {
            violations.push(`Blocked word: ${word}`);
            filteredContent = filteredContent.replace(
                new RegExp(word, 'gi'),
                '***'
            );
        }
    }
    
    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(content)) {
            violations.push('Suspicious pattern detected');
            filteredContent = filteredContent.replace(pattern, '***');
        }
    }
    
    return {
        isSafe: violations.length === 0,
        violations,
        filteredContent,
    };
}

/**
 * Validate trade for parental controls
 */
export async function validateParentalControls(
    db: any,
    userId: string,
    tradeValue: number
): Promise<{ allowed: boolean; reason?: string }> {
    try {
        const user = await db`
            SELECT role, parent_email FROM users WHERE id = ${userId}
        `;
        
        if (!user[0]) {
            return { allowed: false, reason: 'User not found' };
        }
        
        // If child account, check parental controls
        if (user[0].role === 'child' && user[0].parent_email) {
            const parent = await db`
                SELECT rowbucks FROM users WHERE email = ${user[0].parent_email} AND role = 'parent'
            `;
            
            // In real implementation, would check parental control settings
            // For MVP, allow if parent exists
            if (!parent[0]) {
                return { allowed: false, reason: 'Parent account not found' };
            }
        }
        
        return { allowed: true };
    } catch (error) {
        console.error('Error validating parental controls:', error);
        return { allowed: false, reason: 'Validation error' };
    }
}

/**
 * Check if user should be auto-flagged
 */
export async function shouldAutoFlag(
    db: any,
    userId: string
): Promise<boolean> {
    try {
        // Check reports in last 7 days
        const recentReports = await db`
            SELECT COUNT(*) as count FROM reports
            WHERE reported_user_id = ${userId}
            AND created_at > NOW() - INTERVAL '7 days'
        `;
        
        // Check declined offers (potential spam)
        const declinedOffers = await db`
            SELECT COUNT(*) as count FROM offers
            WHERE from_user_id = ${userId}
            AND status = 'declined'
            AND created_at > NOW() - INTERVAL '1 day'
        `;
        
        const reportCount = parseInt(recentReports[0]?.count || '0');
        const declinedCount = parseInt(declinedOffers[0]?.count || '0');
        
        // Auto-flag if 3+ reports or 10+ declined offers
        return reportCount >= 3 || declinedCount >= 10;
    } catch (error) {
        console.error('Error checking auto-flag:', error);
        return false;
    }
}
