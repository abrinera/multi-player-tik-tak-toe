// Pure win-detection utility. Not authoritative — server re-checks — but used for UI hints and tests.
export function checkWin(
  board: string[],
  size: number,
  winLength: number,
  lastPos: number
): number[] | null {
  const sym = board[lastPos];
  if (!sym) return null;
  const row = Math.floor(lastPos / size);
  const col = lastPos % size;
  const dirs: [number, number][] = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    const cells: number[] = [lastPos];
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === sym) {
      cells.push(r * size + c); r += dr; c += dc;
    }
    r = row - dr; c = col - dc;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === sym) {
      cells.push(r * size + c); r -= dr; c -= dc;
    }
    if (cells.length >= winLength) return cells.sort((a, b) => a - b);
  }
  return null;
}

export function isDraw(board: string[]): boolean {
  return board.every((c) => c && c !== "");
}
