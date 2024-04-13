from typing import assert_never

from tapl.parser import FalseV, If, IsZero, Pred, Succ, Term, TrueV, Value, Zero

class NoRulesApply(Exception):
    pass


def ss_eval(t: Term) -> Term:
    match t:
        case If(If=TrueV(),Then=then_):
            return then_
        case If(If=FalseV(),Else=else_):
            return else_
        case If(If=if_,Then=then_,Else=else_):
            return If(If=ss_eval(if_), Then=then_, Else=else_)

        case Succ(term=t):
            return Succ(ss_eval(t))
        case Pred(term=Zero()):
            return Zero()
        case Pred(term=Succ(term=t1)) if isnumericalval(t1):
            return t1
        case Pred(term=t1):
            return Pred(ss_eval(t1))

        case IsZero(term=Zero()):
            return TrueV()
        case IsZero(term=Succ(t1)) if isnumericalval(t1):
            return FalseV()
        case IsZero(term=t1):
            return IsZero(ss_eval(t1))

        case Zero() | Succ() | TrueV() | FalseV():
            raise NoRulesApply()

        case _:
            assert_never(t)

def isval(t: Term) -> bool:
    match t:
        case TrueV():
            return True
        case FalseV():
            return True
        case _ if isnumericalval(t):
            return True
        case _:
            return False

def isnumericalval(t: Term) -> bool:
    match t:
        case Succ():
            return True
        case Zero():
            return True
        case _:
            return False
