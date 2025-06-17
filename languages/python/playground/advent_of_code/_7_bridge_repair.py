from enum import auto, Enum
from dataclasses import dataclass, field
from functools import reduce
from itertools import product, zip_longest
from pathlib import Path

class Operator(Enum):
    ADD = auto()
    MUL = auto()
    CONCAT = auto()

    def __repr__(self) -> str:
        if self == Operator.ADD:
            return "+"
        elif self == Operator.MUL:
            return "*"
        else:
            return "||"

    def __str__(self) -> str:
        return repr(self)

@dataclass
class Equation:
    result: int 
    operands: list[int]

    def __repr__(self):
        return f"{self.result}: {" ".join(str(i) for i in self.operands)}"

    @staticmethod
    def parse(line: str) -> "Equation":
        result, rest = line.split(':')
        return Equation(
            int(result),
            [int(s) for s in rest.split()]
        )

    def can_be_true(self, operators: list[Operator], debug: bool = False) -> bool:
        combinations: list[list[Operator]] = list(
            product(*
                ([operators] * (len(self.operands) - 1))
            )
        )
        for c in combinations:
            if self.result == Equation.eval(self.operands, c):
                if debug:
                    x = zip_longest(self.operands, c)
                    print(reduce(
                        lambda acc, el: acc + f"{str(el[0])}{" " + str(el[1]) + " " if el[1] else ""}",
                        x,
                        ""
                    ))
                return True
        return False

    @staticmethod
    def eval(operands: list[int], operators: list[Operator]) -> int:
        assert(len(operators) == len(operands) - 1)

        if len(operands) == 1:
            return operands[0]
        else:
            match operators:
                case [Operator.ADD, *rest_operators]:
                    return Equation.eval(
                        [operands[0] + operands[1], *operands[2: ]],
                        rest_operators
                    )
                case [Operator.MUL, *rest_operators]:
                    return Equation.eval(
                        [operands[0] * operands[1], *operands[2: ]],
                        rest_operators
                    )
                case [Operator.CONCAT, *rest_operators]:
                    return Equation.eval(
                        [int(str(operands[0]) + str(operands[1])), *operands[2: ]],
                        rest_operators
                    )
                case []:
                    raise RuntimeError
                case _:
                    raise AssertionError



def get_data() -> list[Equation]:
    with (Path(__file__).parent / "_7_bridge_repair.dat").open() as f:
        return [
            Equation.parse(l.strip())
            for l in f.readlines()
        ]

def part1():
    operators = [Operator.ADD, Operator.MUL]
    return sum(eq.result if eq.can_be_true(operators) else 0 for eq in get_data())

def part2():
    operators = [Operator.ADD, Operator.MUL, Operator.CONCAT]
    return sum(eq.result if eq.can_be_true(operators) else 0 for eq in get_data())
