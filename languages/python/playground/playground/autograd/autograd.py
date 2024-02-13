"""
1. Dotfiles for graph
2. Dot for each iteration of evaluation and derivation
3. Backwards
"""
from abc import ABC, abstractmethod, abstractproperty
from dataclasses import dataclass, field
from typing import assert_never, NewType

from graphviz.graphs import Digraph
import jax.numpy as jnp

Dot = NewType('Dot', str)

@dataclass
class NamesGenerator():
    inc: int = 0

    def incr(self) -> int:
        self.inc += 1
        return self.inc

NAMES = NamesGenerator()


@dataclass(frozen=True)
class ValueAndPartial:
    value: float
    partial: float

@dataclass
class Expression(ABC):
    def __add__(self, other):
        return Plus(self, other, name=f"{self.get_name()} + {other.get_name()}")

    def __mul__(self, other):
        return Multiply(self, other, name=f"{self.get_name()} * {other.get_name()}")

    def __pow__(self, other):
        return Power(self, other, name=f"{self.get_name()} ^ {other.get_name()}")

    @abstractmethod
    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        pass

    @abstractmethod
    def generate_dot_repr(self, dot: Digraph):
        pass

    def get_name(self) -> str:
        return self.name  # type: ignore

@dataclass
class Variable(Expression):
    value: float
    name: str

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        if self == variable:
            return ValueAndPartial(self.value, 1)
        else:
            return ValueAndPartial(self.value, 0)

    def generate_dot_repr(self, dot: Digraph):
        pass

@dataclass
class Plus(Expression):
    A: Expression
    B: Expression
    name: str = field(default_factory=lambda: f"v{NAMES.incr()}")

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        x = (self.A.evaluate_and_derive(variable), self.B.evaluate_and_derive(variable))
        match x:
            case (ValueAndPartial(value=A_val, partial=A_deriv), ValueAndPartial(value=B_val, partial=B_deriv)):
                return ValueAndPartial(A_val + B_val, A_deriv + B_deriv)
            case _ as unreachable:
                assert_never(unreachable)

    def generate_dot_repr(self, dot: Digraph):
        dot.node(self.A.get_name())
        dot.node(self.B.get_name())
        dot.edge(self.A.get_name(), self.get_name())
        dot.edge(self.B.get_name(), self.get_name())
        self.A.generate_dot_repr(dot)
        self.B.generate_dot_repr(dot)

@dataclass
class Multiply(Expression):
    A: Expression
    B: Expression
    name: str = field(default_factory=lambda: f"v{NAMES.incr()}")

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        x = (self.A.evaluate_and_derive(variable), self.B.evaluate_and_derive(variable))
        match x:
            case (ValueAndPartial(value=A_val, partial=A_deriv), ValueAndPartial(value=B_val, partial=B_deriv)):
                return ValueAndPartial(A_val * B_val, A_val * B_deriv + B_val * A_deriv)
            case _ as unreachable:
                assert_never(unreachable)

    def generate_dot_repr(self, dot: Digraph):
        dot.node(self.A.get_name())
        dot.node(self.B.get_name())
        dot.edge(self.A.get_name(), self.get_name())
        dot.edge(self.B.get_name(), self.get_name())
        self.A.generate_dot_repr(dot)
        self.B.generate_dot_repr(dot)

@dataclass
class Power(Expression):
    A: Expression
    B: Expression
    name: str = field(default_factory=lambda: f"v{NAMES.incr()}")

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        x = (self.A.evaluate_and_derive(variable), self.B.evaluate_and_derive(variable))
        match x:
            case (ValueAndPartial(value=A_val, partial=A_deriv), ValueAndPartial(value=B_val, partial=B_deriv)):
                return ValueAndPartial(
                    A_val ** B_val,
                    B_val * A_val**(B_val - 1) * A_deriv
                    +
                    jnp.log(B_val) * A_val ** B_val * B_deriv
                )
            case _ as unreachable:
                assert_never(unreachable)

    def generate_dot_repr(self, dot: Digraph):
        dot.node(self.A.get_name())
        dot.node(self.B.get_name())
        dot.edge(self.A.get_name(), self.get_name())
        dot.edge(self.B.get_name(), self.get_name())
        self.A.generate_dot_repr(dot)
        self.B.generate_dot_repr(dot)

x = Variable(2.0, "x")
y = Variable(3.0, "y")

def test(x, y):
    return (x * y)**(x + y)

def test2(x, y):
    return x * (x + y) + y * y

def test3(x, y):
    return (x + x + y)**(x + x + y)

assert test2(x, y).evaluate_and_derive(x).partial == 7
assert test2(x, y).evaluate_and_derive(y).partial == 8
