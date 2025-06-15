from dataclasses import dataclass, field
from enum import auto, Enum
from pathlib import Path
from typing import assert_never

FREE = "."
OBSTACLE = "#"


class Direction(Enum):
    NORTH = auto()
    EAST = auto()
    SOUTH = auto()
    WEST = auto()

    def rotate(self) -> "Direction":
        match self:
            case Direction.NORTH:
                return Direction.EAST
            case Direction.EAST:
                return Direction.SOUTH
            case Direction.SOUTH:
                return Direction.WEST
            case Direction.WEST:
                return Direction.NORTH
            case _:
                assert_never(self)


@dataclass
class Position:
    x: int
    y: int

    def advance(self, d: Direction) -> "Position":
        match d:
            case Direction.NORTH:
                return Position(self.x - 1, self.y)
            case Direction.EAST:
                return Position(self.x, self.y + 1)
            case Direction.SOUTH:
                return Position(self.x + 1, self.y)
            case Direction.WEST:
                return Position(self.x, self.y - 1)
            case _:
                assert_never(d)

    def __hash__(self) -> int:
        return hash((self.x, self.y))


@dataclass
class Map:
    data: list[list[str]]
    itinerary: list[tuple[Position, Direction]] = field(default_factory=list)

    @staticmethod
    def get_data() -> "Map":
        lines = (Path(__file__).parent / "_6_guard_gallivant.dat").open().readlines()
        return Map([list(l.strip()) for l in lines])

    def initial_position(self) -> Position:
        for row_idx in range(len(self.data)):
            for col_idx in range(len(self.data[row_idx])):
                if self.data[row_idx][col_idx] == "^":
                    return Position(row_idx, col_idx)
        raise RuntimeError

    def is_oob(self, p: Position) -> bool:
        if p.x < 0 or p.x >= len(self.data):
            return True
        if p.y < 0 or p.y >= len(self.data[0]):
            return True
        return False

    def mark_visited(self, p: Position, d: Direction):
        self.itinerary.append((p, d))

    def count_visited(self) -> int:
        return len({iti[0] for iti in self.itinerary})

    def mark_obstacle(self, p: Position):
        assert self.data[p.x][p.y] != OBSTACLE
        self.data[p.x][p.y] = OBSTACLE

    def unmark_obstacle(self, p: Position):
        assert self.data[p.x][p.y] == OBSTACLE
        self.data[p.x][p.y] = FREE


def part1():
    map = Map.get_data()

    direction = Direction.NORTH
    position = map.initial_position()
    map.mark_visited(position, direction)

    while True:
        next_p = position.advance(direction)

        if map.is_oob(next_p):
            break
        elif map.data[next_p.x][next_p.y] == OBSTACLE:
            direction = direction.rotate()
            continue
        else:
            position = next_p
            map.mark_visited(position, direction)

    return map.count_visited()


class ExploreOutcome(Enum):
    LOOP = auto()
    EXITED = auto()


def explore(m: Map) -> ExploreOutcome:
    pass


def part2():
    map = Map.get_data()

    ### Part 1 basically
    direction = Direction.NORTH
    position = map.initial_position()
    initial_position = position
    map.mark_visited(position, direction)

    while True:
        next_p = position.advance(direction)

        if map.is_oob(next_p):
            break
        elif map.data[next_p.x][next_p.y] == OBSTACLE:
            direction = direction.rotate()
            continue
        else:
            position = next_p
            map.mark_visited(position, direction)

    obstacle_candidates = [
        iti[0] for iti in map.itinerary if iti[0] != initial_position
    ]

    pass
