import { Game } from './Game';

class GameUI {
    private game: Game;
    private boardElement: HTMLElement;
    private selectedCell: HTMLElement | null = null;

    constructor() {
        this.game = new Game();
        this.boardElement = document.getElementById('board')!;
        this.initializeBoard();
        this.setupEventListeners();
        this.updateLeaderboard();
        this.game.startTimer();
    }

    private initializeBoard(): void {
        this.boardElement.innerHTML = '';
        const board = this.game.getBoard();

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row.toString();
                cell.dataset.col = col.toString();

                const value = board[row][col];
                if (value !== 0) {
                    cell.textContent = value.toString();
                    if (this.game.isFixed(row, col)) {
                        cell.classList.add('fixed');
                    } else {
                        cell.classList.add('input');
                    }
                }

                this.boardElement.appendChild(cell);
            }
        }
    }

    private setupEventListeners(): void {
        // 棋盘点击事件
        this.boardElement.addEventListener('click', (e) => {
            const cell = (e.target as HTMLElement).closest('.cell') as HTMLDivElement;
            if (!cell) return;

            if (this.selectedCell) {
                this.selectedCell.classList.remove('selected');
            }

            cell.classList.add('selected');
            this.selectedCell = cell;

            const row = parseInt(cell.dataset.row!);
            const col = parseInt(cell.dataset.col!);
            this.game.selectCell(row, col);
        });

        // 数字按钮点击事件
        document.querySelectorAll('.number-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const num = parseInt((e.target as HTMLElement).textContent!);
                this.inputNumber(num);
            });
        });

        // 键盘输入事件
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                this.inputNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.inputNumber(0);
            }
        });

        // 新游戏按钮
        document.getElementById('newGame')?.addEventListener('click', () => {
            this.game.newGame();
            this.initializeBoard();
        });

        // 难度选择
        document.getElementById('difficulty')?.addEventListener('change', (e) => {
            const difficulty = (e.target as HTMLSelectElement).value as 'easy' | 'medium' | 'hard';
            this.game.setDifficulty(difficulty);
            this.initializeBoard();
        });

        // 添加提示按钮事件
        document.getElementById('hint')?.addEventListener('click', () => {
            const hint = this.game.getHint();
            if (hint) {
                // 移除之前的提示高亮
                document.querySelectorAll('.cell.hint').forEach(cell => {
                    cell.classList.remove('hint');
                });

                // 找到对应的格子
                const cells = this.boardElement.children;
                const cell = Array.from(cells).find(cell => {
                    const row = parseInt((cell as HTMLElement).dataset.row!);
                    const col = parseInt((cell as HTMLElement).dataset.col!);
                    return row === hint.row && col === hint.col;
                });

                if (cell) {
                    // 高亮显示提示的格子
                    cell.classList.add('hint');
                    // 选中该格子
                    this.selectedCell?.classList.remove('selected');
                    cell.classList.add('selected');
                    this.selectedCell = cell as HTMLElement;
                    this.game.selectCell(hint.row, hint.col);
                    
                    // 3秒后自动填入正确答案
                    setTimeout(() => {
                        this.inputNumber(hint.value);
                        cell.classList.remove('hint');
                    }, 3000);
                }
            }
        });
    }

    private inputNumber(num: number): void {
        if (!this.selectedCell || this.game.isGameOver()) return;

        const row = parseInt(this.selectedCell.dataset.row!);
        const col = parseInt(this.selectedCell.dataset.col!);

        const isValid = this.game.inputNumber(num);
        
        if (num === 0) {
            this.selectedCell.textContent = '';
            this.selectedCell.classList.remove('input', 'error');
        } else {
            this.selectedCell.textContent = num.toString();
            this.selectedCell.classList.add('input');
            
            if (!isValid) {
                this.selectedCell.classList.add('error');
                if (this.game.isGameOver()) {
                    setTimeout(() => {
                        alert('游戏结束！错误次数达到3次。');
                        if (confirm('要开始新游戏吗？')) {
                            this.game.newGame();
                            this.initializeBoard();
                        }
                    }, 100);
                }
            } else {
                this.selectedCell.classList.remove('error');
                this.checkWin();
            }
        }
    }

    private checkWin(): void {
        const board = this.game.getBoard();
        let isFull = true;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    isFull = false;
                    break;
                }
            }
            if (!isFull) break;
        }

        if (isFull && this.isValidSolution()) {
            this.game.stopTimer();
            this.game.saveScore();
            this.updateLeaderboard();
            setTimeout(() => {
                alert(`恭喜你完成了数独！用时：${this.formatTime(this.game.getElapsedTime())}`);
                if (confirm('要开始新游戏吗？')) {
                    this.game.newGame();
                    this.initializeBoard();
                }
            }, 100);
        }
    }

    private isValidSolution(): boolean {
        const board = this.game.getBoard();

        // 检查每一行
        for (let row = 0; row < 9; row++) {
            if (!this.isValidSet(board[row])) return false;
        }

        // 检查每一列
        for (let col = 0; col < 9; col++) {
            const column = board.map(row => row[col]);
            if (!this.isValidSet(column)) return false;
        }

        // 检查每个3x3方块
        for (let blockRow = 0; blockRow < 9; blockRow += 3) {
            for (let blockCol = 0; blockCol < 9; blockCol += 3) {
                const block: number[] = [];
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        block.push(board[blockRow + i][blockCol + j]);
                    }
                }
                if (!this.isValidSet(block)) return false;
            }
        }

        return true;
    }

    private isValidSet(numbers: Array<number>): boolean {
        const set = new Set(numbers);
        return set.size === 9 && !set.has(0);
    }

    private updateLeaderboard(): void {
        const scoresElement = document.getElementById('scores');
        if (!scoresElement) return;

        const scores = this.game.getScores();
        scoresElement.innerHTML = scores.map((score, index) => `
            <div class="score-item">
                <span>#${index + 1}</span>
                <span>${this.formatTime(score.time)}</span>
                <span>${score.difficulty}</span>
            </div>
        `).join('');
    }

    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// 启动���戏
new GameUI(); 