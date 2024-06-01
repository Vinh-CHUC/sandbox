import string
from typing import assert_never

from tapl.untyped_lambda.parser import Abstraction, Application, Term, Variable


# def eval(Term[int]) -> Abstraction:
#     pass


def shift(by: int, above: int, t: Term[int]) -> Term[int]:
    match t:
        case Variable(index=index) if index >= above:
            return Variable(index=index + by)
        case Variable(index=index):
            return t
        case Abstraction(term=term):
            return Abstraction(term=shift(by=by, above=above + 1, t=term))
        case Application(abstraction=a, operand=b):
            return Application(
                abstraction=shift(by, above, a), operand=shift(by, above, b)
            )
        case _:
            assert_never(t)


def substitute(index: int, from_term: Term[int], to_term: Term[int]) -> Term[int]:
    match from_term:
        case Variable(index=idx) if idx == index:
            return to_term
        case Variable():
            return from_term
        case Abstraction(term=term):
            return Abstraction(
                term=substitute(
                    index + 1, from_term=term, to_term=shift(by=1, above=0, t=to_term)
                )
            )
        case Application(abstraction=a, operand=b):
            return Application(
                abstraction=substitute(index, a, to_term),
                operand=substitute(index, b, to_term),
            )
        case _:
            assert_never(from_term)
