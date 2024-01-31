"""
1. Add names to Variables
2. Add non-compulsory names to other expressions, if not specified generate from some global counter
3. Dotfiles for graph
4. Dot for each iteration of evaluation and derivation
"""
from abc import ABC, abstractmethod, abstractproperty
from dataclasses import dataclass, field
from typing import assert_never, NewType

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

@dataclass(frozen=True)
class Expression(ABC):
    def __add__(self, other):
        return Plus(self, other)

    def __mul__(self, other):
        return Multiply(self, other)

    def __pow__(self, other):
        return Power(self, other)

    @abstractmethod
    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        pass

    @abstractmethod
    def generate_dot_repr(self) -> Dot:
        pass

@dataclass(frozen=True)
class Variable(Expression):
    value: float
    name: str

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        if self == variable:
            return ValueAndPartial(self.value, 1)
        else:
            return ValueAndPartial(self.value, 0)

    def generate_dot_repr(self) -> Dot:
        return Dot("")

@dataclass(frozen=True)
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

    def generate_dot_repr(self) -> Dot:
        return Dot("")

@dataclass(frozen=True)
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

    def generate_dot_repr(self) -> Dot:
        return Dot("")

@dataclass(frozen=True)
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

    def generate_dot_repr(self) -> Dot:
        return Dot("")

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
