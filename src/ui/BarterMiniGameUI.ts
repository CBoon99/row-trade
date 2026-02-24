/**
 * Barter Mini-Game UI Component
 * Shows a Rowblocks slider puzzle during offer creation
 */

import { BarterMiniGame } from '../utils/barterMiniGame';

export class BarterMiniGameUI {
    private game: BarterMiniGame;
    private container: HTMLElement | null = null;
    private onComplete: ((result: { won: boolean; bonusRowbucks: number }) => void) | null = null;
    
    constructor() {
        this.game = new BarterMiniGame();
    }
    
    /**
     * Show the mini-game modal
     */
    show(onComplete: (result: { won: boolean; bonusRowbucks: number }) => void): void {
        this.onComplete = onComplete;
        this.game.init();
        
        const modal = document.createElement('div');
        modal.className = 'barter-game-modal';
        modal.innerHTML = `
            <div class="barter-game-content">
                <h2>🎮 Barter Mini-Game!</h2>
                <p class="game-instructions">
                    Solve the Rowblocks puzzle to earn bonus Rowbucks!<br>
                    Slide the blocks to arrange them 1-8 (empty space at bottom-right)
                </p>
                <div class="barter-game-grid" id="barter-game-grid"></div>
                <div class="game-info">
                    <p class="game-timer">Time: <span id="game-timer">0</span>s</p>
                    <button class="btn-secondary" onclick="window.barterGameUI.skip()">Skip</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.container = modal;
        
        // Make globally accessible
        (window as any).barterGameUI = this;
        
        this.render();
        this.startTimer();
    }
    
    /**
     * Render the game grid
     */
    private render(): void {
        const gridEl = document.getElementById('barter-game-grid');
        if (!gridEl) return;
        
        const grid = this.game.getGrid();
        const moves = this.game.getPossibleMoves();
        
        gridEl.innerHTML = grid.map((value, index) => {
            if (value === 0) {
                return `<div class="game-tile empty" data-index="${index}"></div>`;
            }
            const canMove = moves.includes(index);
            return `
                <div class="game-tile ${canMove ? 'movable' : ''}" 
                     data-index="${index}"
                     onclick="window.barterGameUI.handleMove(${index})">
                    <span class="tile-number">${value}</span>
                </div>
            `;
        }).join('');
        
        // Check if solved
        if (this.game.isSolved()) {
            setTimeout(() => this.complete(), 500);
        }
    }
    
    /**
     * Handle tile move
     */
    handleMove(index: number): void {
        if (this.game.move(index)) {
            this.render();
        }
    }
    
    /**
     * Start timer
     */
    private startTimer(): void {
        const startTime = Date.now();
        const timerEl = document.getElementById('game-timer');
        
        const interval = setInterval(() => {
            if (!timerEl || !this.container) {
                clearInterval(interval);
                return;
            }
            
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timerEl.textContent = elapsed.toString();
        }, 100);
    }
    
    /**
     * Skip the game
     */
    skip(): void {
        this.complete(false);
    }
    
    /**
     * Complete the game
     */
    private complete(forceWin: boolean = true): void {
        const result = this.game.getResult();
        if (!forceWin && !result.won) {
            result.bonusRowbucks = 0;
        }
        
        if (this.container) {
            this.container.innerHTML = `
                <div class="barter-game-content">
                    <h2>${result.won ? '🎉 You Won!' : '⏭️ Skipped'}</h2>
                    ${result.won ? `
                        <p class="game-result">You earned <strong>${result.bonusRowbucks} bonus Rowbucks</strong>!</p>
                    ` : `
                        <p class="game-result">No bonus this time. Try again next offer!</p>
                    `}
                    <button class="btn-primary" onclick="window.barterGameUI.close()">Continue</button>
                </div>
            `;
        }
        
        setTimeout(() => {
            if (this.onComplete) {
                this.onComplete({ won: result.won, bonusRowbucks: result.bonusRowbucks });
            }
        }, 1000);
    }
    
    /**
     * Close the modal
     */
    close(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
