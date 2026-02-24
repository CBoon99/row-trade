/**
 * Barter Mini-Game: Rowblocks Slider Puzzle
 * Win bonus Rowbucks by solving a simple slider puzzle during offer creation
 */

export interface BarterGameResult {
    won: boolean;
    bonusRowbucks: number;
    timeTaken: number;
}

export class BarterMiniGame {
    private grid: number[] = [];
    private size = 3; // 3x3 grid
    private emptyIndex = 8;
    private startTime = 0;
    
    /**
     * Initialize a new game
     */
    init(): void {
        // Create solved state [1,2,3,4,5,6,7,8,0]
        this.grid = Array.from({ length: this.size * this.size - 1 }, (_, i) => i + 1);
        this.grid.push(0); // Empty space
        this.emptyIndex = this.size * this.size - 1;
        
        // Shuffle (make 50 random moves)
        for (let i = 0; i < 50; i++) {
            const moves = this.getPossibleMoves();
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                this.move(randomMove);
            }
        }
        
        this.startTime = Date.now();
    }
    
    /**
     * Get current grid state
     */
    getGrid(): number[] {
        return [...this.grid];
    }
    
    /**
     * Check if puzzle is solved
     */
    isSolved(): boolean {
        for (let i = 0; i < this.grid.length - 1; i++) {
            if (this.grid[i] !== i + 1) return false;
        }
        return this.grid[this.grid.length - 1] === 0;
    }
    
    /**
     * Get possible moves (indices that can move)
     */
    getPossibleMoves(): number[] {
        const moves: number[] = [];
        const row = Math.floor(this.emptyIndex / this.size);
        const col = this.emptyIndex % this.size;
        
        // Check up
        if (row > 0) moves.push((row - 1) * this.size + col);
        // Check down
        if (row < this.size - 1) moves.push((row + 1) * this.size + col);
        // Check left
        if (col > 0) moves.push(row * this.size + (col - 1));
        // Check right
        if (col < this.size - 1) moves.push(row * this.size + (col + 1));
        
        return moves;
    }
    
    /**
     * Move a tile
     */
    move(index: number): boolean {
        if (!this.getPossibleMoves().includes(index)) return false;
        
        // Swap with empty
        [this.grid[this.emptyIndex], this.grid[index]] = [this.grid[index], this.grid[this.emptyIndex]];
        this.emptyIndex = index;
        return true;
    }
    
    /**
     * Get game result
     */
    getResult(): BarterGameResult {
        const timeTaken = Date.now() - this.startTime;
        const won = this.isSolved();
        
        // Bonus based on time (faster = more bonus)
        let bonusRowbucks = 0;
        if (won) {
            if (timeTaken < 10000) bonusRowbucks = 5; // Under 10s = 5 bonus
            else if (timeTaken < 20000) bonusRowbucks = 3; // Under 20s = 3 bonus
            else bonusRowbucks = 1; // Over 20s = 1 bonus
        }
        
        return { won, bonusRowbucks, timeTaken };
    }
}
