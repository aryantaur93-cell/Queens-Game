import { NQueensSolver } from './solver.js';
import { sounds } from './audio.js';

class QueensApp {
  constructor() {
    this.solver = new NQueensSolver();
    this.n = 8;
    this.level = 'medium'; // 'easy' | 'medium' | 'intermediate'
    this.queens = []; // [{ row, col }]
    this.marks = new Set(); // Set of "row,col"
    this.history = [];
    this.moves = 0;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isTimerRunning = false;
    this.hasWon = false;
    this.markMode = false;

    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.showScreen('menu');
  }

  cacheDom() {
    // Screens
    this.dom.screenMenu = document.getElementById('screen-menu');
    this.dom.screenSetup = document.getElementById('screen-setup');
    this.dom.screenGame = document.getElementById('screen-game');
    this.dom.screenQuit = document.getElementById('screen-quit');

    // Menu Screen
    this.dom.btnMenuNewGame = document.getElementById('btn-menu-new-game');
    this.dom.btnMenuQuit = document.getElementById('btn-menu-quit');

    // Setup Screen
    this.dom.inputQueensCount = document.getElementById('input-queens-count');
    this.dom.diffCards = document.querySelectorAll('.diff-card');
    this.dom.chipBtns = document.querySelectorAll('.chip-btn');
    this.dom.btnStartGame = document.getElementById('btn-start-game');
    this.dom.btnSetupBack = document.getElementById('btn-setup-back');

    // Game Screen
    this.dom.btnGameToMenu = document.getElementById('btn-game-to-menu');
    this.dom.gameLevelTag = document.getElementById('game-level-tag');
    this.dom.statQueensPlaced = document.getElementById('stat-queens-placed');
    this.dom.statQueensTarget = document.getElementById('stat-queens-target');
    this.dom.statMoves = document.getElementById('stat-moves');
    this.dom.statTimer = document.getElementById('stat-timer');
    this.dom.conflictIndicator = document.getElementById('conflict-indicator');
    this.dom.conflictIcon = document.getElementById('conflict-icon');
    this.dom.conflictLabel = document.getElementById('conflict-label');
    this.dom.gameToast = document.getElementById('game-toast');

    // Board
    this.dom.coordsTop = document.getElementById('coords-top');
    this.dom.coordsLeft = document.getElementById('coords-left');
    this.dom.chessGrid = document.getElementById('chess-grid');
    this.dom.laserSvg = document.getElementById('laser-svg');

    // In-game actions
    this.dom.btnActionHint = document.getElementById('btn-action-hint');
    this.dom.btnActionUndo = document.getElementById('btn-action-undo');
    this.dom.btnActionMark = document.getElementById('btn-action-mark');
    this.dom.btnActionReset = document.getElementById('btn-action-reset');

    // Quit Screen
    this.dom.btnQuitReturn = document.getElementById('btn-quit-return');

    // Win Modal
    this.dom.winModal = document.getElementById('win-modal');
    this.dom.winQueensCount = document.getElementById('win-queens-count');
    this.dom.winStatTime = document.getElementById('win-stat-time');
    this.dom.winStatMoves = document.getElementById('win-stat-moves');
    this.dom.btnWinAgain = document.getElementById('btn-win-again');
    this.dom.btnWinMenu = document.getElementById('btn-win-menu');
  }

  bindEvents() {
    // 1. Menu navigation
    this.dom.btnMenuNewGame?.addEventListener('click', () => this.showScreen('setup'));
    this.dom.btnMenuQuit?.addEventListener('click', () => this.showScreen('quit'));

    // 2. Setup Screen events
    this.dom.btnSetupBack?.addEventListener('click', () => this.showScreen('menu'));
    this.dom.btnQuitReturn?.addEventListener('click', () => this.showScreen('menu'));

    // Quick chips for N
    this.dom.chipBtns?.forEach(chip => {
      chip.addEventListener('click', () => {
        this.dom.chipBtns.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const n = parseInt(chip.dataset.n, 10);
        this.dom.inputQueensCount.value = n;
      });
    });

    this.dom.inputQueensCount?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.dom.chipBtns.forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.dataset.n, 10) === val);
      });
    });

    // Level selector
    this.dom.diffCards?.forEach(card => {
      card.addEventListener('click', () => {
        this.dom.diffCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.level = card.dataset.level;
      });
    });

    // Start Game button
    this.dom.btnStartGame?.addEventListener('click', () => {
      let n = parseInt(this.dom.inputQueensCount.value, 10);
      if (isNaN(n) || n < 4) n = 4;
      if (n > 16) n = 16;
      this.n = n;
      this.startNewGame();
    });

    // 3. Game Screen events
    this.dom.btnGameToMenu?.addEventListener('click', () => {
      this.stopTimer();
      this.showScreen('menu');
    });

    this.dom.btnActionHint?.addEventListener('click', () => this.giveHint());
    this.dom.btnActionUndo?.addEventListener('click', () => this.undoMove());
    this.dom.btnActionReset?.addEventListener('click', () => this.resetBoard());

    this.dom.btnActionMark?.addEventListener('click', () => {
      this.markMode = !this.markMode;
      this.dom.btnActionMark.classList.toggle('active', this.markMode);
      this.showToast(this.markMode ? 'Mark Mode Active: Click to place ✕' : 'Queen Mode Active');
    });

    // Prevent context menu on board to allow right-click marking
    this.dom.chessGrid?.addEventListener('contextmenu', (e) => e.preventDefault());

    // 4. Win Modal events
    this.dom.btnWinAgain?.addEventListener('click', () => {
      this.dom.winModal.classList.remove('show');
      this.startNewGame();
    });

    this.dom.btnWinMenu?.addEventListener('click', () => {
      this.dom.winModal.classList.remove('show');
      this.showScreen('menu');
    });
  }

  showScreen(screenName) {
    const screens = [
      this.dom.screenMenu,
      this.dom.screenSetup,
      this.dom.screenGame,
      this.dom.screenQuit
    ];

    screens.forEach(s => s?.classList.remove('active'));

    if (screenName === 'menu') this.dom.screenMenu?.classList.add('active');
    else if (screenName === 'setup') this.dom.screenSetup?.classList.add('active');
    else if (screenName === 'game') this.dom.screenGame?.classList.add('active');
    else if (screenName === 'quit') this.dom.screenQuit?.classList.add('active');
  }

  startNewGame() {
    this.queens = [];
    this.marks.clear();
    this.history = [];
    this.moves = 0;
    this.hasWon = false;
    this.stopTimer();
    this.timerSeconds = 0;
    this.updateTimerDisplay();

    this.dom.statQueensTarget.textContent = this.n;
    this.dom.statQueensPlaced.textContent = 0;
    this.dom.statMoves.textContent = 0;
    this.dom.gameLevelTag.textContent = this.level.toUpperCase();

    // If level is Easy, give 1 safe pre-placed queen as a head-start
    if (this.level === 'easy') {
      const allSols = this.solver.findAllSolutions(this.n, 1);
      if (allSols.length > 0) {
        const col = allSols[0][0];
        this.queens.push({ row: 0, col });
        this.showToast('Easy Mode: 1 safe Queen pre-placed to guide you!');
      }
    }

    this.renderCoordinates();
    this.renderBoard();
    this.showScreen('game');
  }

  renderCoordinates() {
    const cols = Array.from({ length: this.n }, (_, i) => String.fromCharCode(65 + i));
    const rows = Array.from({ length: this.n }, (_, i) => (i + 1).toString());

    this.dom.coordsTop.innerHTML = cols.map(c => `<div class="coord-lbl">${c}</div>`).join('');
    this.dom.coordsLeft.innerHTML = rows.map(r => `<div class="coord-lbl">${r}</div>`).join('');
  }

  renderBoard() {
    if (!this.dom.chessGrid) return;

    this.dom.chessGrid.style.gridTemplateColumns = `repeat(${this.n}, 1fr)`;
    this.dom.chessGrid.style.gridTemplateRows = `repeat(${this.n}, 1fr)`;
    this.dom.chessGrid.innerHTML = '';

    const conflictAnalysis = this.solver.findConflicts(this.queens, this.n);
    const attackedMap = conflictAnalysis.attackedMap;

    const conflictCoords = new Set();
    conflictAnalysis.conflictingPairs.forEach(p => {
      conflictCoords.add(`${p.q1.row},${p.q1.col}`);
      conflictCoords.add(`${p.q2.row},${p.q2.col}`);
    });

    const queenMap = new Map();
    this.queens.forEach(q => queenMap.set(`${q.row},${q.col}`, q));

    for (let r = 0; r < this.n; r++) {
      for (let c = 0; c < this.n; c++) {
        const tile = document.createElement('div');
        tile.className = `tile ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        tile.dataset.row = r;
        tile.dataset.col = c;

        const key = `${r},${c}`;
        const hasQueen = queenMap.has(key);
        const hasMark = this.marks.has(key);

        // In Easy mode, show subtle threat highlights
        if (this.level === 'easy' && !hasQueen && attackedMap[r][c] > 0) {
          tile.classList.add('attacked');
        }

        if (hasQueen) {
          const isConflicted = conflictCoords.has(key);
          tile.appendChild(this.createQueenSVG(isConflicted));
        } else if (hasMark) {
          const xSpan = document.createElement('span');
          xSpan.className = 'mark-x';
          xSpan.textContent = '✕';
          tile.appendChild(xSpan);
        }

        // Left Click
        tile.addEventListener('click', (e) => this.handleTileClick(r, c, e));

        // Right Click
        tile.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.toggleMark(r, c);
        });

        this.dom.chessGrid.appendChild(tile);
      }
    }

    // In Medium and Easy mode, show conflict lines. Intermediate hides lines for pure challenge.
    if (this.level !== 'intermediate') {
      this.drawConflictLines(conflictAnalysis.conflictLines);
    } else {
      this.dom.laserSvg.innerHTML = '';
    }

    this.updateStats(conflictAnalysis);
  }

  createQueenSVG(isConflicted) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', `queen-icon ${isConflicted ? 'conflict' : ''}`);
    svg.innerHTML = `
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
      <circle cx="2" cy="4" r="1.5" fill="currentColor"></circle>
      <circle cx="22" cy="4" r="1.5" fill="currentColor"></circle>
      <circle cx="12" cy="4" r="1.5" fill="currentColor"></circle>
    `;
    return svg;
  }

  drawConflictLines(lines) {
    if (!this.dom.laserSvg) return;
    this.dom.laserSvg.innerHTML = '';
    if (!lines || lines.length === 0) return;

    this.dom.laserSvg.setAttribute('viewBox', `0 0 ${this.n} ${this.n}`);

    lines.forEach(line => {
      const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgLine.setAttribute('x1', line.c1 + 0.5);
      svgLine.setAttribute('y1', line.r1 + 0.5);
      svgLine.setAttribute('x2', line.c2 + 0.5);
      svgLine.setAttribute('y2', line.r2 + 0.5);
      svgLine.setAttribute('stroke', '#ff4d4d');
      svgLine.setAttribute('stroke-width', '2.5');
      svgLine.setAttribute('stroke-dasharray', '5 4');
      svgLine.setAttribute('stroke-linecap', 'round');
      svgLine.setAttribute('vector-effect', 'non-scaling-stroke');

      this.dom.laserSvg.appendChild(svgLine);
    });
  }

  handleTileClick(r, c, e) {
    if (this.hasWon) return;

    if (this.markMode || e.shiftKey) {
      this.toggleMark(r, c);
      return;
    }

    this.toggleQueen(r, c);
  }

  toggleQueen(r, c) {
    const existingIdx = this.queens.findIndex(q => q.row === r && q.col === c);

    // If placing a new queen but already reached N queens
    if (existingIdx < 0 && this.queens.length >= this.n) {
      this.showToast(`All ${this.n} Queens placed! Move or remove one to adjust.`);
      sounds.playConflict();
      return;
    }

    this.startTimerIfNotRunning();

    // Save history snapshot
    this.history.push({
      queens: this.queens.map(q => ({ ...q })),
      marks: new Set(this.marks)
    });

    if (existingIdx >= 0) {
      this.queens.splice(existingIdx, 1);
      sounds.playRemove();
    } else {
      this.marks.delete(`${r},${c}`);
      this.queens.push({ row: r, col: c });
      this.moves++;
      sounds.playPlace(r, this.n);
    }

    this.renderBoard();
    this.checkWinCondition();
  }

  toggleMark(r, c) {
    const key = `${r},${c}`;
    const hasQueen = this.queens.some(q => q.row === r && q.col === c);
    if (hasQueen) return;

    this.history.push({
      queens: this.queens.map(q => ({ ...q })),
      marks: new Set(this.marks)
    });

    if (this.marks.has(key)) {
      this.marks.delete(key);
      sounds.playRemove();
    } else {
      this.marks.add(key);
      sounds.playMark();
    }
    this.renderBoard();
  }

  undoMove() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.queens = prev.queens;
    this.marks = prev.marks;
    sounds.playRemove();
    this.renderBoard();
  }

  resetBoard() {
    this.queens = [];
    this.marks.clear();
    this.history = [];
    this.moves = 0;
    this.stopTimer();
    this.timerSeconds = 0;
    this.updateTimerDisplay();
    this.renderBoard();
    this.showToast('Board cleared.');
  }

  giveHint() {
    const hint = this.solver.getHint(this.queens, this.n);
    if (hint.status === 'hint_available') {
      this.showToast(hint.message);
      const target = this.dom.chessGrid.querySelector(`[data-row="${hint.suggestedRow}"][data-col="${hint.suggestedCol}"]`);
      if (target) {
        target.classList.add('hint-pulse');
        setTimeout(() => target.classList.remove('hint-pulse'), 2500);
      }
    } else if (hint.status === 'conflict') {
      this.showToast('Resolve attacking queens first!');
      sounds.playConflict();
    } else if (hint.status === 'deadlock') {
      this.showToast('Current placement cannot be completed. Remove a queen!');
      sounds.playConflict();
    } else {
      this.showToast(hint.message);
    }
  }

  updateStats(conflictAnalysis = null) {
    if (!conflictAnalysis) {
      conflictAnalysis = this.solver.findConflicts(this.queens, this.n);
    }

    const placed = this.queens.length;
    this.dom.statQueensPlaced.textContent = placed;
    this.dom.statMoves.textContent = this.moves;
    this.dom.btnActionUndo.disabled = this.history.length === 0;

    const conflicts = conflictAnalysis.conflictingPairs.length;
    if (conflicts > 0) {
      this.dom.conflictIndicator.className = 'conflict-alert danger';
      this.dom.conflictIcon.textContent = '⚠️';
      this.dom.conflictLabel.textContent = `${conflicts} Conflict${conflicts > 1 ? 's' : ''}`;
    } else {
      this.dom.conflictIndicator.className = 'conflict-alert';
      this.dom.conflictIcon.textContent = '✓';
      this.dom.conflictLabel.textContent = placed === this.n ? 'Solved!' : 'No Conflicts';
    }
  }

  checkWinCondition() {
    if (this.queens.length !== this.n) return;

    const analysis = this.solver.findConflicts(this.queens, this.n);
    if (!analysis.hasConflicts) {
      this.hasWon = true;
      this.stopTimer();
      sounds.playVictory();

      setTimeout(() => {
        this.dom.winQueensCount.textContent = this.n;
        this.dom.winStatTime.textContent = this.formatTime(this.timerSeconds);
        this.dom.winStatMoves.textContent = this.moves;
        this.dom.winModal.classList.add('show');
      }, 350);
    } else {
      sounds.playConflict();
    }
  }

  startTimerIfNotRunning() {
    if (this.isTimerRunning) return;
    this.isTimerRunning = true;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
  }

  updateTimerDisplay() {
    this.dom.statTimer.textContent = this.formatTime(this.timerSeconds);
  }

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  showToast(msg) {
    if (!this.dom.gameToast) return;
    this.dom.gameToast.textContent = msg;
    this.dom.gameToast.style.display = 'block';

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.gameToast.style.display = 'none';
    }, 3500);
  }
}

// Launch app on load
window.addEventListener('DOMContentLoaded', () => {
  const app = new QueensApp();
  app.init();
  window.queensApp = app;
});
