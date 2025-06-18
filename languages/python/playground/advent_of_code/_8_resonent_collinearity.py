from enum import auto, Enum
from dataclasses import dataclass, field
from functools import cached_property, reduce, lru_cache
from itertools import chain, combinations, product, zip_longest
from pathlib import Path

NA = "."

@dataclass
class Vector:
    x: int
    y: int | float

    def __mul__(self, i: int) -> "Vector":
        return Vector(self.x * i, self.y * i)

    def normalise_x(self) -> "Vector":
        if self.x == 0:
            return Vector(1, 0)
        else:
            return Vector(1, float(self.y) / float(self.x))

@dataclass
class Coord:
    x: int
    y: int

    def __add__(self, v: Vector) -> "Coord":
        if isinstance(v.y, float):
            raise AssertionError
        return Coord(self.x + v.x, self.y + v.y)

    def __sub__(self, other: "Coord") -> "Vector":
        return Vector(self.x - other.x, self.y - other.y)

    def is_within_bounds(self, x, y) -> bool:
        return (
            self.x >= 0 and self.x < x
            and self.y >= 0 and self.y < y
        )

    def __hash__(self):
        return hash((self.x, self.y))

@dataclass
class AntennaMap:
    data: list[list[str]]

    def antennas(self, freq: str) -> list[Coord]:
        coords = []
        for x in range(len(self.data)):
            for y in range(len(self.data[0])):
                if self.data[x][y] == freq:
                    coords.append(Coord(x, y))
        return coords

    def antinodes(self, freq: str) -> list[Coord]:
        antinodes = []
        for ant_a, ant_b in combinations(self.antennas(freq), 2):
            a = ant_a + (ant_b - ant_a) * 2
            b = ant_b + (ant_a - ant_b) * 2
            antinodes.extend([
                n for n in [a, b] if n.is_within_bounds(len(self.data), len(self.data[0]))
            ])
        return antinodes

    def antinodes_line(self, freq: str) -> list[Coord]:
        antinodes = []
        for ant_a, ant_b in combinations(self.antennas(freq), 2):
            norm = (ant_b - ant_a)
            for i in range(len(self(self.data))):
                pass 
        return antinodes

    @cached_property
    def frequencies(self):
        return sorted(set(chain(
            *self.data
        )) - {NA, '#'})

    def __repr__(self):
        s = ""
        for d in self.data:
            s = s + "".join(d) + "\n"
        return s

    def __str__(self) -> str:
        return repr(self)


def get_data(test: bool = False) -> AntennaMap:
    if test:
        with (Path(__file__).parent / "_8_resonent_collinearity.test.dat").open() as f:
            return AntennaMap([list(l.strip()) for l in f.readlines()])
    else:
        with (Path(__file__).parent / "_8_resonent_collinearity.dat").open() as f:
            return AntennaMap([list(l.strip()) for l in f.readlines()])

def part1(test: bool = False):
    antenna_map = get_data(test)
    antinodes = []
    for f in antenna_map.frequencies:
        antinodes.extend(antenna_map.antinodes(f))
    return len(set(antinodes))

