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

def get_data() -> list[list[str]]:
    lines = (Path(__file__).parent / "_6_guard_gallivant.dat").open().readlines()
    return [
        list(l.strip()) for l in lines
    ]
