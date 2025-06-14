from pathlib import Path
from typing import Generator

TEST_DATA = [
    list(range(5)),
    list(range(5, 10)),
    list(range(10, 15)),
    list(range(15, 20)),
    list(range(20, 25)),
]

XMAS = "XMAS"
SAMX = "SAMX"

def get_data() -> list[list[str]]:
    rows = (Path(__file__).parent / "_4_ceres_search.dat").read_text().splitlines()
    return [
        list(r)
        for r in rows
    ]

def rows(data: list[list[str]]) -> Generator[list[str]]:
    yield from data

def columns(data: list[list[str]]) -> Generator[list[str]]:
    N = len(data[0])

    for col_idx in range(N):
        yield list(data[row_idx][col_idx] for row_idx in range(N))

def diagonals(data: list[list[str]]) -> Generator[list[str]]:
    N = len(data[0])

    # Increasing row_idx
    yield list(data[idx][idx] for idx in range(N))
    for row_idx in range(1, N):
        yield list(data[row_idx + i][i] for i in range(N-row_idx)) 
    for col_idx in range(1, N):
        yield list(data[i][col_idx+i] for i in range(N-col_idx)) 

    # Decreasing row_idx
    yield list(data[N-1-idx][idx] for idx in range(N))
    for row_idx in range(1, N):
        yield list(data[N - 1 - row_idx - i][i] for i in range(N-row_idx)) 
    for col_idx in range(1, N):
        yield list(data[N - 1 - i][col_idx+i] for i in range(N-col_idx)) 

def part1() -> int:
    d = get_data()
    total = 0

    for r in rows(d):
        for i in range(len(r) - 3):
            if "".join(r[i:i+4]) == XMAS or "".join(r[i:i+4]) == SAMX:
                total = total + 1

    for r in columns(d):
        for i in range(len(r) - 3):
            if "".join(r[i:i+4]) == XMAS or "".join(r[i:i+4]) == SAMX:
                total = total + 1

    for r in diagonals(d):
        for i in range(len(r) - 3):
            if "".join(r[i:i+4]) == XMAS or "".join(r[i:i+4]) == SAMX:
                total = total + 1

    return total

def check_small_square(square: list[list[str]]) -> bool:
    if not square[1][1] == "A":
        return False
    if (t:= [square[0][0], square[2][2]]) != ["M", "S"] and t != ["S", "M"]:
        return False
    if (t:= [square[0][2], square[2][0]]) != ["M", "S"] and t != ["S", "M"]:
        return False

    return True

def part2() -> int:
    d = get_data()
    N = len(d[0])

    total = 0

    for row_idx in range(N-2):
        for col_idx in range(N-2):
            small_square = [
                [d[i][j] for j in range(col_idx, col_idx+3)] 
                for i in range(row_idx, row_idx+3)
            ]
            if check_small_square(small_square):
                total += 1

    return total
