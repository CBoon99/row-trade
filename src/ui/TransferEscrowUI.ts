/**
 * Transfer Escrow UI Component
 * Secure product transfer with manual codes and confirmations
 */

import { useTradingStoreExtended } from '../stores/TradingStoreExtended';
import { authManager } from '../systems/AuthManager';

export class TransferEscrowUI {
    private container: HTMLElement;
    private store = useTradingStoreExtended;
    
    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = container;
    }
    
    /**
     * Show transfer escrow for an accepted offer
     */
    async show(offerId: string): Promise<void> {
        const offer = this.store.getState().offers.find(o => o.id === offerId);
        if (!offer || offer.status !== 'accepted') {
            alert('Offer not found or not accepted');
            return;
        }
        
        const listing = this.store.getState().listings.find(l => l.id === offer.listingId);
        const escrow = this.store.getState().transferEscrows.find(e => e.offerId === offerId);
        
        // If no escrow exists, create one
        if (!escrow) {
            this.showCreateEscrow(offerId, offer, listing);
        } else {
            this.showEscrowStatus(offerId, offer, listing, escrow);
        }
    }
    
    /**
     * Show create escrow form
     */
    private showCreateEscrow(offerId: string, offer: any, listing: any): void {
        const currentUser = this.store.getState().currentUser!;
        const isFromUser = offer.fromUserId === currentUser.id;
        
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="transfer-escrow-modal">
                <div class="escrow-content">
                    <div class="escrow-header">
                        <h2>🔐 Secure Transfer</h2>
                        <button class="btn-close" onclick="window.transferEscrowUI.hide()">×</button>
                    </div>
                    
                    <div class="escrow-info">
                        <p><strong>Trade:</strong> ${offer.offering} ↔ ${offer.wanting}</p>
                        <p><strong>Listing:</strong> ${listing?.itemName || 'Unknown'}</p>
                    </div>
                    
                    <div class="escrow-instructions">
                        <h3>How it works:</h3>
                        <ol>
                            <li>Both traders enter their transfer codes (game codes, item IDs, etc.)</li>
                            <li>Codes are hidden until both confirm receipt</li>
                            <li>Once both confirm, codes are revealed and trade completes</li>
                            <li>If one trader doesn't confirm within 24 hours, trade expires</li>
                        </ol>
                    </div>
                    
                    <form class="escrow-form" onsubmit="window.transferEscrowUI.submitEscrow(event, '${offerId}')">
                        <div class="form-group">
                            <label>Your Transfer Code (${isFromUser ? 'What you\'re sending' : 'What you\'re receiving'}):</label>
                            <input type="text" name="transferCode" required 
                                   placeholder="e.g., Roblox code, game item ID, etc.">
                            <small>💡 This will be hidden until both traders confirm</small>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Start Transfer</button>
                            <button type="button" class="btn-secondary" onclick="window.transferEscrowUI.hide()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        (window as any).transferEscrowUI = this;
        this.injectStyles();
    }
    
    /**
     * Show escrow status
     */
    private showEscrowStatus(offerId: string, offer: any, listing: any, escrow: any): void {
        const currentUser = this.store.getState().currentUser!;
        const isFromUser = offer.fromUserId === currentUser.id;
        const isToUser = offer.toUserId === currentUser.id;
        
        const myCode = isFromUser ? escrow.codeFrom : escrow.codeTo;
        const theirCode = isFromUser ? escrow.codeTo : escrow.codeFrom;
        
        const myConfirmed = isFromUser ? escrow.confirmedFrom : escrow.confirmedTo;
        const theirConfirmed = isFromUser ? escrow.confirmedTo : escrow.confirmedFrom;
        
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="transfer-escrow-modal">
                <div class="escrow-content">
                    <div class="escrow-header">
                        <h2>🔐 Transfer Status</h2>
                        <button class="btn-close" onclick="window.transferEscrowUI.hide()">×</button>
                    </div>
                    
                    <div class="escrow-status">
                        ${escrow.status === 'completed' ? `
                            <div class="status-complete">
                                <h3>✅ Transfer Complete!</h3>
                                <p>Both traders have confirmed. Codes revealed below:</p>
                            </div>
                        ` : escrow.status === 'expired' ? `
                            <div class="status-expired">
                                <h3>⏰ Transfer Expired</h3>
                                <p>The 24-hour window has passed. Trade cancelled.</p>
                            </div>
                        ` : `
                            <div class="status-pending">
                                <h3>⏳ Transfer Pending</h3>
                                <p>Waiting for both traders to confirm receipt...</p>
                            </div>
                        `}
                    </div>
                    
                    <div class="escrow-codes">
                        <div class="code-section">
                            <h4>Your Code:</h4>
                            <div class="code-display">
                                ${myConfirmed && escrow.status === 'completed' ? `
                                    <code>${myCode}</code>
                                ` : `
                                    <code>••••••••</code>
                                    <small>Hidden until both confirm</small>
                                `}
                            </div>
                            ${!myConfirmed && escrow.status !== 'completed' && escrow.status !== 'expired' ? `
                                <button class="btn-primary" onclick="window.transferEscrowUI.confirmTransfer('${offerId}', '${isFromUser ? 'from' : 'to'}')">
                                    ✅ I Received My Item
                                </button>
                            ` : myConfirmed ? `
                                <p class="confirmed">✅ You confirmed</p>
                            ` : ''}
                        </div>
                        
                        <div class="code-section">
                            <h4>Their Code:</h4>
                            <div class="code-display">
                                ${theirConfirmed && escrow.status === 'completed' ? `
                                    <code>${theirCode}</code>
                                ` : `
                                    <code>••••••••</code>
                                    <small>Hidden until both confirm</small>
                                `}
                            </div>
                            ${theirConfirmed ? `
                                <p class="confirmed">✅ They confirmed</p>
                            ` : `
                                <p class="waiting">⏳ Waiting for their confirmation...</p>
                            `}
                        </div>
                    </div>
                    
                    ${escrow.expiresAt && escrow.status !== 'completed' && escrow.status !== 'expired' ? `
                        <div class="escrow-timer">
                            <p>⏰ Expires in: <span id="timer-display">${this.formatTimeRemaining(escrow.expiresAt)}</span></p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        (window as any).transferEscrowUI = this;
        this.injectStyles();
        
        // Start timer if needed
        if (escrow.expiresAt && escrow.status !== 'completed' && escrow.status !== 'expired') {
            this.startTimer(escrow.expiresAt, offerId);
        }
    }
    
    /**
     * Submit escrow
     */
    async submitEscrow(event: Event, offerId: string): Promise<void> {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const transferCode = formData.get('transferCode') as string;
        
        if (!transferCode) {
            alert('Please enter a transfer code');
            return;
        }
        
        try {
            const response = await fetch('/.netlify/functions/api-create-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authManager.getToken()}`,
                },
                body: JSON.stringify({
                    offerId,
                    transferCode,
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                this.store.getState().createTransferEscrow(offerId, data.codeFrom || transferCode, data.codeTo || '');
                alert('✅ Transfer started! Waiting for other trader...');
                await this.show(offerId);
            } else {
                alert('❌ Failed to create transfer');
            }
        } catch (error) {
            console.error('Error creating transfer:', error);
            alert('❌ Error creating transfer');
        }
    }
    
    /**
     * Confirm transfer
     */
    async confirmTransfer(offerId: string, side: 'from' | 'to'): Promise<void> {
        if (!confirm('Confirm you received your item? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/.netlify/functions/api-confirm-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authManager.getToken()}`,
                },
                body: JSON.stringify({
                    offerId,
                    side,
                }),
            });
            
            if (response.ok) {
                this.store.getState().confirmTransfer(offerId, side);
                alert('✅ Confirmed! Waiting for other trader...');
                await this.show(offerId);
            } else {
                alert('❌ Failed to confirm transfer');
            }
        } catch (error) {
            console.error('Error confirming transfer:', error);
            alert('❌ Error confirming transfer');
        }
    }
    
    /**
     * Format time remaining
     */
    private formatTimeRemaining(expiresAt: number): string {
        const now = Date.now();
        const remaining = expiresAt - now;
        
        if (remaining <= 0) return 'Expired';
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    /**
     * Start timer
     */
    private startTimer(expiresAt: number, offerId: string): void {
        const timerEl = document.getElementById('timer-display');
        if (!timerEl) return;
        
        const interval = setInterval(() => {
            const remaining = expiresAt - Date.now();
            if (remaining <= 0) {
                timerEl.textContent = 'Expired';
                clearInterval(interval);
                // Refresh escrow status
                setTimeout(() => this.show(offerId), 1000);
            } else {
                timerEl.textContent = this.formatTimeRemaining(expiresAt);
            }
        }, 1000);
    }
    
    /**
     * Hide escrow UI
     */
    hide(): void {
        this.container.style.display = 'none';
    }
    
    /**
     * Inject styles
     */
    private injectStyles(): void {
        if (document.getElementById('transfer-escrow-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'transfer-escrow-styles';
        style.textContent = `
            .transfer-escrow-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 10, 30, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            
            .escrow-content {
                background: linear-gradient(135deg, rgba(0, 30, 60, 0.95) 0%, rgba(0, 50, 100, 0.95) 100%);
                border: 3px solid #00d4ff;
                border-radius: 25px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 0 50px rgba(0, 212, 255, 0.5);
            }
            
            .escrow-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .escrow-header h2 {
                color: #00d4ff;
                font-size: 2rem;
            }
            
            .escrow-info {
                background: rgba(0, 50, 100, 0.5);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .escrow-instructions {
                background: rgba(0, 50, 100, 0.3);
                border-radius: 15px;
                padding: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .escrow-instructions ol {
                margin-left: 1.5rem;
                color: #88d0ff;
            }
            
            .escrow-status {
                margin-bottom: 1.5rem;
            }
            
            .status-complete {
                background: rgba(76, 175, 80, 0.2);
                border: 2px solid #4caf50;
                border-radius: 15px;
                padding: 1rem;
                text-align: center;
            }
            
            .status-expired {
                background: rgba(244, 67, 54, 0.2);
                border: 2px solid #f44336;
                border-radius: 15px;
                padding: 1rem;
                text-align: center;
            }
            
            .status-pending {
                background: rgba(255, 193, 7, 0.2);
                border: 2px solid #ffc107;
                border-radius: 15px;
                padding: 1rem;
                text-align: center;
            }
            
            .escrow-codes {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .code-section {
                background: rgba(0, 50, 100, 0.5);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 1rem;
            }
            
            .code-section h4 {
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }
            
            .code-display {
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #00d4ff;
                border-radius: 10px;
                padding: 1rem;
                text-align: center;
                margin-bottom: 0.5rem;
            }
            
            .code-display code {
                font-size: 1.2rem;
                font-weight: bold;
                color: #00d4ff;
                letter-spacing: 2px;
            }
            
            .code-display small {
                display: block;
                color: #88d0ff;
                margin-top: 0.5rem;
            }
            
            .confirmed {
                color: #4caf50;
                font-weight: bold;
            }
            
            .waiting {
                color: #ffc107;
            }
            
            .escrow-timer {
                text-align: center;
                background: rgba(255, 193, 7, 0.2);
                border: 2px solid #ffc107;
                border-radius: 15px;
                padding: 1rem;
            }
            
            .escrow-timer p {
                color: #ffc107;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}
