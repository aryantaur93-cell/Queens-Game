/**
 * N-Queens Solver & Game Engine
 * Provides backtracking algorithm, conflict detection, hint calculation,
 * and step-by-step generator for real-time visualization.
 */

export class NQueensSolver {
  constructor() {
    this.knownSolutionCounts = {
      1: 1, 2: 0, 3: 0, 4: 2, 5: 10,
      6: 4, 7: 40, 8: 92, 9: 352, 10: 724,
      11: 2680, 12: 14200, 13: 73712, 14: 365596
    };
  }

  /**
   * Returns known count of solutions if available, else null
   */
  getTheoreticalSolutionCount(n) {
    return this.knownSolutionCounts[n] ?? null;
  }

  /**
   * Find all solutions up to maxSolutions limit using recursive backtracking
   * @param {number} n Board size (n x n)
   * @param {number} maxLimit Maximum solutions to collect
   * @returns {Array<Array<number>>} Array of solutions, where solution[r] = col
   */
  findAllSolutions(n, maxLimit = 1000) {
    if (n === 2 || n === 3) return [];
    if (n === 1) return [[0]];

    const solutions = [];
    const cols = new Set();
    const diag1 = new Set(); // r - c
    const diag2 = new Set(); // r + c
    const current = [];

    function backtrack(r) {
      if (solutions.length >= maxLimit) return;
      if (r === n) {
        solutions.push([...current]);
        return;
      }
      for (let c = 0; c < n; c++) {
        const d1 = r - c;
        const d2 = r + c;
        if (cols.has(c) || diag1.has(d1) || diag2.has(d2)) continue;

        cols.add(c);
        diag1.add(d1);
        diag2.add(d2);
        current.push(c);

        backtrack(r + 1);

        current.pop();
        cols.delete(c);
        diag1.delete(d1);
        diag2.delete(d2);
      }
    }

    backtrack(0);
    return solutions;
  }

  /**
   * Generator for step-by-step backtracking visualization
   * Yields step objects with current board state, trial positions, and backtracks
   */
  *solveStepByStep(n, maxSolutions = 1) {
    if (n < 4 && n > 1) {
      yield {
        type: 'done',
        message: `No solution exists for N=${n}! Mathematically impossible.`,
        solutions: [],
        stats: { steps: 0, backtracks: 0 }
      };
      return;
    }

    let steps = 0;
    let backtracks = 0;
    const solutions = [];
    const board = Array(n).fill(-1); // row -> col (-1 means empty)
    const cols = new Set();
    const diag1 = new Set();
    const diag2 = new Set();

    function* backtrackGen(r) {
      if (solutions.length >= maxSolutions) return;

      if (r === n) {
        solutions.push([...board]);
        yield {
          type: 'solution_found',
          row: r - 1,
          col: board[r - 1],
          board: [...board],
          solutionsCount: solutions.length,
          stats: { steps, backtracks }
        };
        return;
      }

      for (let c = 0; c < n; c++) {
        steps++;
        const d1 = r - c;
        const d2 = r + c;
        const hasConflict = cols.has(c) || diag1.has(d1) || diag2.has(d2);

        // Yield trial step
        yield {
          type: 'try_cell',
          row: r,
          col: c,
          board: [...board],
          hasConflict,
          conflictReason: cols.has(c) ? 'column' : diag1.has(d1) ? 'main diagonal' : diag2.has(d2) ? 'anti diagonal' : null,
          stats: { steps, backtracks }
        };

        if (!hasConflict) {
          // Place queen
          cols.add(c);
          diag1.add(d1);
          diag2.add(d2);
          board[r] = c;

          yield {
            type: 'queen_placed',
            row: r,
            col: c,
            board: [...board],
            stats: { steps, backtracks }
          };

          yield* backtrackGen(r + 1);

          if (solutions.length >= maxSolutions) return;

          // Backtrack
          backtracks++;
          cols.delete(c);
          diag1.delete(d1);
          diag2.delete(d2);
          board[r] = -1;

          yield {
            type: 'backtrack',
            row: r,
            col: c,
            board: [...board],
            stats: { steps, backtracks }
          };
        }
      }
    }

    yield* backtrackGen(0);

    yield {
      type: 'done',
      solutions,
      stats: { steps, backtracks }
    };
  }

  /**
   * Find conflicts among an arbitrary set of placed queens
   * @param {Array<{row: number, col: number}>} queens 
   * @returns {Object} { hasConflicts, conflictingPairs, conflictingQueenIndices, attackedCells }
   */
  findConflicts(queens, n) {
    const conflictingPairs = [];
    const conflictIndices = new Set();
    const conflictLines = []; // segment coords for visual laser lines

    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const q1 = queens[i];
        const q2 = queens[j];

        const sameRow = q1.row === q2.row;
        const sameCol = q1.col === q2.col;
        const sameDiag = Math.abs(q1.row - q2.row) === Math.abs(q1.col - q2.col);

        if (sameRow || sameCol || sameDiag) {
          conflictIndices.add(i);
          conflictIndices.add(j);
          conflictingPairs.push({
            q1, q2,
            type: sameRow ? 'row' : sameCol ? 'col' : 'diag'
          });
          conflictLines.push({
            r1: q1.row, c1: q1.col,
            r2: q2.row, c2: q2.col,
            type: sameRow ? 'row' : sameCol ? 'col' : 'diag'
          });
        }
      }
    }

    // Calculate all squares attacked by currently placed queens
    const attackedMap = Array.from({ length: n }, () => Array(n).fill(0));
    for (const q of queens) {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (r === q.row && c === q.col) continue;
          if (r === q.row || c === q.col || Math.abs(r - q.row) === Math.abs(c - q.col)) {
            attackedMap[r][c]++;
          }
        }
      }
    }

    return {
      hasConflicts: conflictingPairs.length > 0,
      conflictIndices: Array.from(conflictIndices),
      conflictingPairs,
      conflictLines,
      attackedMap
    };
  }

  /**
   * Checks if current queens placement is valid (no mutual conflicts)
   * and if it can lead to a full N-Queens solution.
   * If yes, returns a hint (next safe queen coordinate).
   */
  getHint(queens, n) {
    if (n < 4 && n !== 1) {
      return { status: 'impossible', message: `No valid configuration exists for N=${n}.` };
    }

    const { hasConflicts, conflictingPairs } = this.findConflicts(queens, n);
    if (hasConflicts) {
      const p = conflictingPairs[0];
      return {
        status: 'conflict',
        message: `Queens at (${p.q1.row + 1}, ${p.q1.col + 1}) and (${p.q2.row + 1}, ${p.q2.col + 1}) attack each other (${p.type}). Fix this first!`,
        conflictPair: p
      };
    }

    if (queens.length === n) {
      return { status: 'won', message: 'Board is already complete and valid! 🎉' };
    }

    // Check if current placed queens have at most 1 queen per row
    const rowCounts = Array(n).fill(0);
    const colCounts = Array(n).fill(0);
    const fixedRows = new Map(); // row -> col

    for (const q of queens) {
      rowCounts[q.row]++;
      colCounts[q.col]++;
      fixedRows.set(q.row, q.col);
    }

    if (rowCounts.some(cnt => cnt > 1) || colCounts.some(cnt => cnt > 1)) {
      return {
        status: 'invalid_rows',
        message: 'Multiple queens placed in the same row or column. Remove the duplicate!'
      };
    }

    // Backtracking search constrained by already placed queens
    const cols = new Set(queens.map(q => q.col));
    const diag1 = new Set(queens.map(q => q.row - q.col));
    const diag2 = new Set(queens.map(q => q.row + q.col));
    const current = Array(n).fill(-1);
    for (const [r, c] of fixedRows.entries()) {
      current[r] = c;
    }

    let solutionFound = null;

    function backtrack(r) {
      if (solutionFound) return;
      if (r === n) {
        solutionFound = [...current];
        return;
      }

      if (fixedRows.has(r)) {
        // Row already fixed by user, check next
        backtrack(r + 1);
        return;
      }

      for (let c = 0; c < n; c++) {
        const d1 = r - c;
        const d2 = r + c;
        if (cols.has(c) || diag1.has(d1) || diag2.has(d2)) continue;

        cols.add(c);
        diag1.add(d1);
        diag2.add(d2);
        current[r] = c;

        backtrack(r + 1);

        current[r] = -1;
        cols.delete(c);
        diag1.delete(d1);
        diag2.delete(d2);
      }
    }

    backtrack(0);

    if (!solutionFound) {
      return {
        status: 'deadlock',
        message: 'Current queen placement cannot lead to any valid solution. Try removing one or more queens!'
      };
    }

    // Find first row that user hasn't filled yet
    for (let r = 0; r < n; r++) {
      if (!fixedRows.has(r)) {
        return {
          status: 'hint_available',
          suggestedRow: r,
          suggestedCol: solutionFound[r],
          message: `Hint: Place a queen at Row ${r + 1}, Col ${String.fromCharCode(65 + solutionFound[r])} (Cell ${r + 1},${solutionFound[r] + 1})`
        };
      }
    }

    return { status: 'unknown', message: 'No hint found.' };
  }
}
