import { safetyModerator } from '../systems/SafetyModerator';
import { useTradingStoreExtended } from '../stores/TradingStoreExtended';

/**
 * Onboarding Tutorial & Safety Quiz
 * First-time user experience
 */
export class OnboardingUI {
    private container: HTMLElement;
    private currentStep = 0;
    private store = useTradingStoreExtended;
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Check if user needs onboarding
     */
    needsOnboarding(): boolean {
        return !this.store.getState().safetyQuizCompleted;
    }
    
    /**
     * Show onboarding flow
     */
    show(): void {
        this.container.style.display = 'block';
        this.currentStep = 0;
        this.showWelcome();
    }
    
    /**
     * Show welcome screen
     */
    private showWelcome(): void {
        this.container.innerHTML = `
            <div class="onboarding-screen">
                <div class="onboarding-content">
                    <h1>🌊 Welcome to Row-Trader!</h1>
                    <p class="subtitle">Safe Trading Hub for Rowblocks & Gamers</p>
                    
                    <div class="welcome-info">
                        <h2>What is Row-Trader?</h2>
                        <p>Row-Trader is a safe place to:</p>
                        <ul>
                            <li>🔄 <strong>Swap</strong> items with friends</li>
                            <li>⇄ <strong>Trade</strong> across different games</li>
                            <li>🎁 <strong>Gift</strong> items to buddies</li>
                            <li>💰 Earn <strong>Rowbucks</strong> from fair trades</li>
                        </ul>
                        
                        <h2>Learn Bartering & Negotiation!</h2>
                        <p>Row-Trader teaches you real skills:</p>
                        <ul>
                            <li>💡 How to make fair offers</li>
                            <li>💡 How to counter-offer (negotiate)</li>
                            <li>💡 How to barter like at a market</li>
                            <li>💡 Always stay safe online</li>
                        </ul>
                    </div>
                    
                    <button class="btn-primary btn-large" onclick="onboardingUI.nextStep()">
                        Let's Get Started! →
                    </button>
                </div>
            </div>
        `;
        this.injectStyles();
    }
    
    /**
     * Show safety quiz
     */
    private showSafetyQuiz(): void {
        const quiz = safetyModerator.getSafetyQuiz();
        const currentQuestion = quiz[this.currentStep - 1];
        
        if (!currentQuestion) {
            this.completeOnboarding();
            return;
        }
        
        this.container.innerHTML = `
            <div class="onboarding-screen">
                <div class="onboarding-content">
                    <h1>🛡️ Safety Quiz</h1>
                    <p class="subtitle">Question ${this.currentStep} of ${quiz.length}</p>
                    
                    <div class="quiz-question">
                        <h2>${currentQuestion.question}</h2>
                        <div class="quiz-options">
                            ${currentQuestion.options.map((option, index) => `
                                <button class="quiz-option" onclick="onboardingUI.selectAnswer(${index})">
                                    ${option}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Select quiz answer
     */
    selectAnswer(selectedIndex: number): void {
        const quiz = safetyModerator.getSafetyQuiz();
        const currentQuestion = quiz[this.currentStep - 1];
        
        if (!currentQuestion) return;
        
        const isCorrect = selectedIndex === currentQuestion.correctAnswer;
        
        // Show feedback
        const feedback = document.createElement('div');
        feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.innerHTML = `
            <div class="feedback-content">
                <h3>${isCorrect ? '✅ Correct!' : '❌ Not quite'}</h3>
                <p>${currentQuestion.explanation}</p>
                <button class="btn-primary" onclick="onboardingUI.nextStep()">
                    ${isCorrect ? 'Next Question →' : 'Try Again'}
                </button>
            </div>
        `;
        
        document.querySelector('.quiz-options')?.appendChild(feedback);
        
        if (isCorrect) {
            this.currentStep++;
            setTimeout(() => {
                if (this.currentStep <= quiz.length) {
                    this.showSafetyQuiz();
                } else {
                    this.completeOnboarding();
                }
            }, 2000);
        }
    }
    
    /**
     * Next step
     */
    nextStep(): void {
        this.currentStep++;
        
        if (this.currentStep === 1) {
            this.showSafetyQuiz();
        } else if (this.currentStep <= safetyModerator.getSafetyQuiz().length + 1) {
            this.showSafetyQuiz();
        } else {
            this.completeOnboarding();
        }
    }
    
    /**
     * Complete onboarding
     */
    private completeOnboarding(): void {
        this.store.getState().completeSafetyQuiz();
        this.store.getState().addRowbucks(10, 'Completed safety quiz');
        
        this.container.innerHTML = `
            <div class="onboarding-screen">
                <div class="onboarding-content">
                    <h1>🎉 You're All Set!</h1>
                    <p class="subtitle">Welcome to Row-Trader!</p>
                    
                    <div class="completion-info">
                        <h2>What's Next?</h2>
                        <ul>
                            <li>✅ Complete your profile (add favorite games)</li>
                            <li>✅ Browse listings from users with shared games</li>
                            <li>✅ Make your first offer and learn to negotiate</li>
                            <li>✅ Add friends and start gifting</li>
                            <li>✅ Earn Rowbucks and become a Master Barterer!</li>
                        </ul>
                        
                        <div class="safety-reminder">
                            <h3>🛡️ Remember:</h3>
                            <ul>
                                <li>Never share personal info (email, phone, address)</li>
                                <li>All trading stays in-app</li>
                                <li>Report anything suspicious</li>
                                <li>Have fun and learn negotiation skills!</li>
                            </ul>
                        </div>
                    </div>
                    
                    <button class="btn-primary btn-large" onclick="onboardingUI.finish()">
                        Start Trading! 🚀
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Finish onboarding
     */
    finish(): void {
        this.container.style.display = 'none';
        // Show trading hub
        if (window.enhancedTradingUI) {
            window.enhancedTradingUI.showEnhancedHub();
        }
    }
    
    /**
     * Inject styles
     */
    private injectStyles(): void {
        if (document.getElementById('onboarding-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'onboarding-ui-styles';
        style.textContent = `
            .onboarding-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 10, 30, 0.98);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                color: #fff;
            }
            
            .onboarding-content {
                max-width: 800px;
                padding: 3rem;
                text-align: center;
            }
            
            .onboarding-content h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #001133, #6B46C1, #06B6D4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .welcome-info, .completion-info {
                text-align: left;
                background: rgba(26, 58, 90, 0.5);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 2rem;
                margin: 2rem 0;
            }
            
            .welcome-info ul, .completion-info ul {
                list-style: none;
                padding: 0;
            }
            
            .welcome-info li, .completion-info li {
                margin: 0.5rem 0;
                padding-left: 1rem;
            }
            
            .quiz-question {
                background: rgba(26, 58, 90, 0.7);
                border: 2px solid #06B6D4;
                border-radius: 10px;
                padding: 2rem;
                margin: 2rem 0;
            }
            
            .quiz-options {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .quiz-option {
                background: #1a3a5a;
                border: 2px solid #06B6D4;
                color: #fff;
                padding: 1rem 2rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1rem;
                transition: all 0.2s;
            }
            
            .quiz-option:hover {
                background: #2a4a6a;
                transform: translateX(10px);
            }
            
            .quiz-feedback {
                margin-top: 2rem;
                padding: 1.5rem;
                border-radius: 10px;
            }
            
            .quiz-feedback.correct {
                background: rgba(0, 255, 0, 0.2);
                border: 2px solid #00ff00;
            }
            
            .quiz-feedback.incorrect {
                background: rgba(255, 0, 0, 0.2);
                border: 2px solid #ff0000;
            }
            
            .btn-large {
                padding: 1.5rem 3rem;
                font-size: 1.3rem;
            }
            
            .safety-reminder {
                background: rgba(255, 215, 0, 0.1);
                border: 2px solid #ffd700;
                border-radius: 10px;
                padding: 1.5rem;
                margin-top: 2rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Make globally accessible
declare global {
    interface Window {
        onboardingUI: OnboardingUI;
    }
}
