import string
from typing import assert_never

from lark.lark import abstractmethod

from tapl.untyped_lambda.parser import Abstraction, Application, Term, Variable

class NoRulesApply(Exception):
    pass


def eval(t: Term[int]) -> Term[int]:
    try:
        t1 = ss_eval(t)
        return eval(t1)
    except NoRulesApply:
        return t

def ss_eval(t: Term[int]) -> Term[int]:
    match t:
        case Variable():
            raise AssertionError
        case Abstraction() as abs:
            raise NoRulesApply
        case Application(abstraction=Abstraction() as abs, operand=Abstraction() as oper):
            shifted_operand = shift(by=1, above=0, t=oper)
            substituted = substitute(0, abs.term, shifted_operand)
            shifted_back = shift(by=-1, above=0, t=substituted)
            return shifted_back
        case Application(abstraction=Abstraction() as abs, operand=oper):
            return Application(abstraction=abs, operand=eval(oper))
        case Application(abstraction=abs, operand=oper):
            return Application(abstraction=eval(abs), operand=oper)



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
