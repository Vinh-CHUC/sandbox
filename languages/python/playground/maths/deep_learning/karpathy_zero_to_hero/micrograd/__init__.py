import math
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import StrEnum, auto


class Op(StrEnum):
    ADD = auto()
    MUL = auto()
    TANH = auto()


@dataclass(eq=False)
class Value:
    data: float
    grad: float = 0.0
    children: tuple[Value, ...] = field(default_factory=tuple)
    op: Op | None = None
    label: str = ""

    def __post_init__(self):
        self._backward: Callable = lambda: None

    def __add__(self, other) -> Value:
        v = Value(self.data + other.data, children=(self, other), op=Op.ADD)

        def _backward():
            self.grad += 1.0 * v.grad
            other.grad += 1.0 * v.grad

        v._backward = _backward
        return v

    def __mul__(self, other) -> Value:
        v = Value(self.data * other.data, children=(self, other), op=Op.MUL)

        def _backward():
            self.grad += other.data * v.grad
            other.grad += self.data * v.grad

        v._backward = _backward

        return v

    def tanh(self) -> Value:
        v = Value(
            (math.exp(2 * self.data) - 1) / (math.exp(2 * self.data) + 1),
            children=(self,),
            op=Op.TANH,
        )

        def _backward():
            self.grad += (1 - v.data ** 2) * v.grad

        v._backward = _backward
        return v

    def __hash__(self):
        return id(self)

    def backward(self):
        topo = []
        visited = set()

        # Basically deduped DFS
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v.children:
                    build_topo(child)
                topo.append(v)

        build_topo(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()
