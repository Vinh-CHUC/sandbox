from os import wait
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Generator, assert_never


def get_data() -> str:
    s = (Path(__file__).parent / "_3_mull_it_over.dat").read_text()
    return s


def part1():
    matches = re.findall(r"mul *\( *(\d+) *, *(\d+) *\)", get_data(), flags=0)
    return sum(int(a) * int(b) for a, b in matches)


@dataclass
class Mul:
    a: int
    b: int

    def __repr__(self) -> str:
        return f"Mul({self.a}, {self.b})"


class Do:
    def __repr__(self) -> str:
        return "Do"


class Dont:
    def __repr__(self) -> str:
        return "Dont"


type ParseResult = Mul | Do | Dont


def parse(matches: list) -> Generator[ParseResult]:
    for m in matches:
        match m:
            case [a, b, _, _] if a and b:
                yield Mul(int(a), int(b))
            case [_, _, x, _] if x:
                yield Dont()
            case [_, _, _, x] if x:
                yield Do()


def part2():
    matches = re.findall(
        r"mul *\( *(\d+) *, *(\d+) *\)|(don\'t\(\))|(do\(\))", get_data(), flags=0
    )
    total = 0
    do = True
    for m in parse(matches):
        match m:
            case Mul(a, b) if do:
                total += a * b
            case Mul(a, b):
                pass
            case Dont():
                do = False
            case Do():
                do = True
            case _:
                return assert_never(m)
    return total
