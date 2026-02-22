/**
 * Safety Moderator System
 * Handles safety checks, word filtering, and violation detection
 */

export class SafetyModerator {
    private blockedWords: string[] = [
        'meet', 'irl', 'real life', 'address', 'phone', 'email',
        'password', 'personal info', 'outside', 'external',
        'home', 'location', 'where do you live',
    ];
    
    private suspiciousPatterns: RegExp[] = [
        /meet\s+(up|me|in|at)/i,
        /outside\s+(the|of|app)/i,
        /real\s+life/i,
        /give\s+me\s+(your|ur)\s+(email|phone|address)/i,
        /contact\s+(me|you)\s+(outside|offline)/i,
    ];
    
    /**
     * Check content for safety violations
     */
    checkContent(content: string): {
        isSafe: boolean;
        violations: string[];
        filteredContent: string;
    } {
        const violations: string[] = [];
        let filteredContent = content;
        
        // Check for blocked words
        const lowerContent = content.toLowerCase();
        for (const word of this.blockedWords) {
            if (lowerContent.includes(word)) {
                violations.push(`Blocked word: ${word}`);
                filteredContent = filteredContent.replace(
                    new RegExp(word, 'gi'),
                    '***'
                );
            }
        }
        
        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
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
     * Check if user should be auto-flagged
     */
    shouldAutoFlag(userId: string, reports: number, declinedOffers: number): boolean {
        // Auto-flag if:
        // - 3+ reports in last 7 days
        // - 10+ declined offers in a row (potential spam)
        return reports >= 3 || declinedOffers >= 10;
    }
    
    /**
     * Generate safety quiz questions
     */
    getSafetyQuiz(): Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
    }> {
        return [
            {
                question: 'Is it safe to share your email address in a trade chat?',
                options: ['Yes', 'No', 'Only if they ask nicely', 'Only for friends'],
                correctAnswer: 1,
                explanation: 'Never share personal information like email, phone, or address. All trading stays in-app!',
            },
            {
                question: 'What should you do if someone asks to meet in real life?',
                options: [
                    'Agree if they seem nice',
                    'Report them immediately',
                    'Ask your parent first',
                    'Ignore the request',
                ],
                correctAnswer: 1,
                explanation: 'Always report anyone who asks to meet outside the app. This is a safety red flag!',
            },
            {
                question: 'What is good negotiation practice?',
                options: [
                    'Demand what you want',
                    'Offer fair trades and listen to counters',
                    'Never accept counter-offers',
                    'Only trade with friends',
                ],
                correctAnswer: 1,
                explanation: 'Good negotiation means making fair offers and being open to counter-offers. It\'s like haggling at a market!',
            },
            {
                question: 'When should you report a user?',
                options: [
                    'Only if they are mean',
                    'If they break safety rules or make you uncomfortable',
                    'Never - reporting is mean',
                    'Only if they decline your offer',
                ],
                correctAnswer: 1,
                explanation: 'Report anyone who breaks safety rules, asks for personal info, or makes you feel uncomfortable. Safety first!',
            },
        ];
    }
    
    /**
     * Validate trade for parental controls
     */
    validateTradeForParentalControls(
        tradeValue: number,
        parentalControls: any
    ): { allowed: boolean; reason?: string } {
        if (!parentalControls) return { allowed: true };
        
        if (parentalControls.maxTradeValue && tradeValue > parentalControls.maxTradeValue) {
            return {
                allowed: false,
                reason: `Trade value exceeds maximum allowed (${parentalControls.maxTradeValue} Rowbucks)`,
            };
        }
        
        if (parentalControls.requireApproval) {
            return {
                allowed: false,
                reason: 'Parent approval required for this trade',
            };
        }
        
        return { allowed: true };
    }
}

export const safetyModerator = new SafetyModerator();
