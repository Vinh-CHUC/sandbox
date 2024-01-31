"""
1. Add names to Variables
2. Add non-compulsory names to other expressions, if not specified generate from some global counter
3. Dotfiles for graph
4. Dot for each iteration of evaluation and derivation
"""
from abc import abstractmethod
from dataclasses import dataclass
from typing import assert_never, NewType

import jax.numpy as jnp
import numpy as np

Dot = NewType('Dot', str)

@dataclass(frozen=True)
class ValueAndPartial:
    value: float
    partial: float

class Expression:
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

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        if self == variable:
            return ValueAndPartial(self.value, 1)
        else:
            return ValueAndPartial(self.value, 0)

@dataclass(frozen=True)
class Plus(Expression):
    A: Expression
    B: Expression

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        x = (self.A.evaluate_and_derive(variable), self.B.evaluate_and_derive(variable))
        match x:
            case (ValueAndPartial(value=A_val, partial=A_deriv), ValueAndPartial(value=B_val, partial=B_deriv)):
                return ValueAndPartial(A_val + B_val, A_deriv + B_deriv)
            case _ as unreachable:
                assert_never(unreachable)

@dataclass(frozen=True)
class Multiply(Expression):
    A: Expression
    B: Expression

    def evaluate_and_derive(self, variable) -> ValueAndPartial:
        x = (self.A.evaluate_and_derive(variable), self.B.evaluate_and_derive(variable))
        match x:
            case (ValueAndPartial(value=A_val, partial=A_deriv), ValueAndPartial(value=B_val, partial=B_deriv)):
                return ValueAndPartial(A_val * B_val, A_val * B_deriv + B_val * A_deriv)
            case _ as unreachable:
                assert_never(unreachable)

@dataclass(frozen=True)
class Power(Expression):
    A: Expression
    B: Expression

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

x = Variable(2.0)
y = Variable(3.0)

def test(x, y):
    return (x * y)**(x + y)

def test2(x, y):
    return x * (x + y) + y * y

def test3(x, y):
    return (x + x + y)**(x + x + y)

assert test2(x, y).evaluate_and_derive(x).partial == 7
assert test2(x, y).evaluate_and_derive(y).partial == 8
