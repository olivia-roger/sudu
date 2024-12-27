export class Game {
    private board: number[][];
    private solution: number[][];
    private fixed: boolean[][];
    private selectedCell: { row: number; col: number } | null = null;
    private difficulty: 'easy' | 'medium' | 'hard' = 'easy';
    private errorCount: number = 0;
    private readonly MAX_ERRORS: number = 3;
    private startTime: number = 0;
    private elapsedTime: number = 0;
    private timerInterval: number | null = null;

    constructor() {
        this.board = Array(9).fill(0).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(0).map(() => Array(9).fill(0));
        this.fixed = Array(9).fill(false).map(() => Array(9).fill(false));
        this.generateNewGame();
    }

    private generateNewGame(): void {
        // 生成完整的数独解
        this.generateSolution();
        // 复制解决方案
        this.board = this.solution.map(row => [...row]);
        // 根据难度移除数字
        this.removeNumbers();
        // 标记固定数字
        this.markFixedNumbers();
    }

    private generateSolution(): void {
        // 清空棋盘
        this.board = Array(9).fill(0).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(0).map(() => Array(9).fill(0));
        
        // 使用回溯法生成有效的数独解
        this.solveSudoku();
        
        // 保存解决方案
        this.solution = this.board.map(row => [...row]);
    }

    private fillBox(row: number, col: number): void {
        const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const randomIndex = Math.floor(Math.random() * numbers.length);
                this.solution[row + i][col + j] = numbers[randomIndex];
                numbers.splice(randomIndex, 1);
            }
        }
    }

    private solveSudoku(): boolean {
        let row = 0;
        let col = 0;
        let isEmpty = false;
        
        // 找到一个空格子
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    row = i;
                    col = j;
                    isEmpty = true;
                    break;
                }
            }
            if (isEmpty) break;
        }
        
        // 如果没有空格子，说明已经解决
        if (!isEmpty) return true;
        
        // 随机尝试1-9的��字
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        // 尝试填充数字
        for (const num of numbers) {
            if (this.isSafeForSolution(row, col, num)) {
                this.board[row][col] = num;
                if (this.solveSudoku()) return true;
                this.board[row][col] = 0;
            }
        }
        
        return false;
    }

    private isSafeForSolution(row: number, col: number, num: number): boolean {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) return false;
        }
        
        // 检查列
        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) return false;
        }
        
        // 检查3x3方块
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i + startRow][j + startCol] === num) return false;
            }
        }
        
        return true;
    }

    private removeNumbers(): void {
        const numbersToRemove = {
            easy: 40,
            medium: 50,
            hard: 60
        }[this.difficulty];

        let count = 0;
        while (count < numbersToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                count++;
            }
        }
    }

    private markFixedNumbers(): void {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.fixed[i][j] = this.board[i][j] !== 0;
            }
        }
    }

    public selectCell(row: number, col: number): void {
        this.selectedCell = { row, col };
    }

    public inputNumber(num: number): boolean {
        if (!this.selectedCell) return false;
        const { row, col } = this.selectedCell;
        
        if (this.fixed[row][col]) return false;
        
        this.board[row][col] = num;
        const isValid = this.isValidMove(row, col, num);
        
        if (!isValid && num !== 0) {
            this.errorCount++;
            this.updateErrorDisplay();
        }
        
        return isValid;
    }

    public getBoard(): number[][] {
        return this.board;
    }

    public isFixed(row: number, col: number): boolean {
        return this.fixed[row][col];
    }

    public getSelectedCell(): { row: number; col: number } | null {
        return this.selectedCell;
    }

    public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
        this.difficulty = difficulty;
        this.generateNewGame();
    }

    public newGame(): void {
        this.errorCount = 0;
        this.updateErrorDisplay();
        this.elapsedTime = 0;
        this.stopTimer();
        this.generateNewGame();
        this.startTimer();
    }

    public isValidMove(row: number, col: number, num: number): boolean {
        // 检查是否与解决方案匹配
        return this.solution[row][col] === num;
    }

    public getErrorCount(): number {
        return this.errorCount;
    }

    public isGameOver(): boolean {
        return this.errorCount >= this.MAX_ERRORS;
    }

    public startTimer(): void {
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = window.setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateTimerDisplay();
        }, 1000);
    }

    public stopTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    public getElapsedTime(): number {
        return this.elapsedTime;
    }

    private updateTimerDisplay(): void {
        const timeElement = document.getElementById('timer');
        if (timeElement) {
            timeElement.textContent = this.formatTime(this.elapsedTime);
        }
    }

    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    public saveScore(): void {
        const scores = this.getScores();
        scores.push({
            time: this.elapsedTime,
            difficulty: this.difficulty,
            date: new Date().toISOString()
        });
        scores.sort((a, b) => a.time - b.time);
        localStorage.setItem('sudoku-scores', JSON.stringify(scores.slice(0, 10)));
    }

    public getScores(): Array<{time: number, difficulty: string, date: string}> {
        const scores = localStorage.getItem('sudoku-scores');
        return scores ? JSON.parse(scores) : [];
    }

    private updateErrorDisplay(): void {
        const errorElement = document.getElementById('errorCount');
        if (errorElement) {
            errorElement.textContent = this.errorCount.toString();
        }
    }

    public getHint(): { row: number; col: number; value: number } | null {
        // 找到一个空格子或错误的格子
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0 || this.board[row][col] !== this.solution[row][col]) {
                    return {
                        row,
                        col,
                        value: this.solution[row][col]
                    };
                }
            }
        }
        return null;
    }
} 