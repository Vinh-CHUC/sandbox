from typing import List, Optional, Tuple


COORD = Tuple[int, int]
BOARD_L = 9
INNER_SQUARE_L = 3
VALUES = [str(i) for i in range(1, BOARD_L + 1)]


def print_board(board: List[List[str]]):
    for i in range(BOARD_L):
        print(board[i])


def pick_empty_cell(board: List[List[str]]) -> Optional[COORD]:
    for i in range(BOARD_L):
        for j in range(BOARD_L):
            if board[i][j] == ".":
                return (i, j)
    return None


def cell_valid_candidates(board: List[List[str]], c: COORD) -> List[str]:
    X, Y = c

    line_vals = [board[X][y] for y in range(BOARD_L)]
    col_vals = [board[x][Y] for x in range(BOARD_L)]

    square_origin: COORD = (
        (X // INNER_SQUARE_L) * INNER_SQUARE_L,
        (Y // INNER_SQUARE_L) * INNER_SQUARE_L,
    )
    square_vals = [
        board[square_origin[0] + x][square_origin[1] + y]
        for x in range(3)
        for y in range(3)
    ]

    return list(
        set(VALUES)
        .difference(line_vals)
        .difference(col_vals)
        .difference(square_vals)
    )


class SolutionInPlace:
    def do_solveSudoku(self, board: List[List[str]]) -> bool:
        empty_cell = pick_empty_cell(board)

        match pick_empty_cell(board):
            case None:
                return True
            case (x, y) as empty_cell:
                match cell_valid_candidates(board, empty_cell):
                    case []:
                        return False
                    case candidates:
                        for c in candidates:
                            board[x][y] = str(c)
                            if self.do_solveSudoku(board):
                                return True
                        board[x][y] = "."
                        return False

    def solveSudoku(self, board: List[List[str]]) -> None:
        self.do_solveSudoku(board)


Solution = SolutionInPlace

board = [
    ["5", "3", ".", ".", "7", ".", ".", ".", "."],
    ["6", ".", ".", "1", "9", "5", ".", ".", "."],
    [".", "9", "8", ".", ".", ".", ".", "6", "."],
    ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
    ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
    ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
    [".", "6", ".", ".", ".", ".", "2", "8", "."],
    [".", ".", ".", "4", "1", "9", ".", ".", "5"],
    [".", ".", ".", ".", "8", ".", ".", "7", "9"],
]
Solution().solveSudoku(board)
assert board == [
    ["5", "3", "4", "6", "7", "8", "9", "1", "2"],
    ["6", "7", "2", "1", "9", "5", "3", "4", "8"],
    ["1", "9", "8", "3", "4", "2", "5", "6", "7"],
    ["8", "5", "9", "7", "6", "1", "4", "2", "3"],
    ["4", "2", "6", "8", "5", "3", "7", "9", "1"],
    ["7", "1", "3", "9", "2", "4", "8", "5", "6"],
    ["9", "6", "1", "5", "3", "7", "2", "8", "4"],
    ["2", "8", "7", "4", "1", "9", "6", "3", "5"],
    ["3", "4", "5", "2", "8", "6", "1", "7", "9"],
]
