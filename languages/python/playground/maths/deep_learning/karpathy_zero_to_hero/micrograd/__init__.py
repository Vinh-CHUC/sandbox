from dataclasses import dataclass, field
from enum import StrEnum, auto


class Op(StrEnum):
    ADD = auto()
    MUL = auto()


@dataclass(eq=False)
class Value:
    data: float
    children: tuple[Value, ...] = field(default_factory=tuple)
    op: Op | None = None

    def __add__(self, other):
        return Value(self.data + other.data, children=(self, other), op=Op.ADD)

    def __mul__(self, other):
        return Value(self.data * other.data, children=(self, other), op=Op.MUL)

    def __hash__(self):
        return id(self)
