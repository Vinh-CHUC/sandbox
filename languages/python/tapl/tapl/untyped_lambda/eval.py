from typing import assert_never

from tapl.untyped_lambda.parser import Abstraction, Application, Term, Variable


def eval(Term) -> Abstraction:
    pass

def shift(by: int, above: int, t: Term) -> Term:
    match t:
        case Variable(index=index) if index >= above:
            return Variable(index=index+by)
        case Variable(index=index):
            return t
        case Abstraction(term=term):
            return Abstraction(term=shift(by=by, above=above+1, t=term))
        case Application(abstraction=a, operand=b):
            return Application(abstraction=shift(by,above,a), operand=shift(by,above,b))
        case _:
            assert_never(t)

def substitute(index: int, t: Term) -> Term:
    pass
