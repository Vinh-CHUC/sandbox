from dataclasses import dataclass
from enum import auto, Enum
from pathlib import Path
from typing import assert_never

FREE = "."
GUARD = "#"
VISITED = "X"

@dataclass
class Position():
    x: int
    y: int

class Direction(Enum):
    NORTH = auto()
    EAST = auto()
    SOUTH = auto()
    WEST = auto()

def rotate(d: Direction) -> Direction:
    match d:
        case Direction.NORTH:
            return Direction.EAST
        case Direction.EAST:
            return Direction.SOUTH
        case Direction.SOUTH:
            return Direction.WEST
        case Direction.WEST:
            return Direction.NORTH
        case _:
            assert_never(d)

def next_position(pos: Position, d: Direction) -> Position:
    match d:
        case Direction.NORTH:
            return Position(pos.x - 1, pos.y)
        case Direction.EAST:
            return Position(pos.x, pos.y + 1)
        case Direction.SOUTH:
            return Position(pos.x + 1, pos.y)
        case Direction.WEST:
            return Position(pos.x, pos.y - 1)
        case _:
            assert_never(d)


def get_data() -> list[list[str]]:
    lines = (Path(__file__).parent / "_6_guard_gallivant.dat").open().readlines()
    return [
        list(l.strip()) for l in lines
    ]


def initial_position(data: list[list[str]]) -> Position:
    for row_idx in range(len(data)):
        for col_idx in range(len(data[row_idx])):
            if data[row_idx][col_idx] == "^":
                return Position(row_idx, col_idx)

    raise RuntimeError

def oob(p: Position, data: list[list[str]]) -> bool:
    if p.x < 0 or p.x >= len(data):
        return True
    if p.y < 0 or p.y >= len(data[0]):
        return True
    return False


def part1():
    data = get_data()

    direction = Direction.NORTH
    position = initial_position(data)
    data[position.x][position.y] = VISITED

    while True:
        next_p = next_position(position, direction)

        if oob(next_p, data):
            break
        elif data[next_p.x][next_p.y] == GUARD:
            direction = rotate(direction)
            continue
        else:
            position = next_p
            data[next_p.x][next_p.y] = VISITED

    visited_count = 0
    for row_idx in range(len(data)):
        for col_idx in range(len(data[row_idx])):
            if data[row_idx][col_idx] == VISITED:
                visited_count += 1

    return visited_count

def part2():
    pass
