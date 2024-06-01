from ast import Not
import string

from tapl.untyped_lambda.parser import Abstraction, Application, Term, Variable

FVs = string.ascii_lowercase


class FreeVariables:
    index: int = 0 

    def get(self) -> str:
        ret = string.ascii_lowercase[self.index]
        self.index += 1
        return ret

def add_names(fvs: int, t: Term[int]) -> Term[str]:
    match t:
        case Variable(index=idx):
            return Variable(index=string.ascii_lowercase[fvs-idx])
        case Abstraction(term=term):
            return Abstraction(term=add_names(fvs+1, term), name=string.ascii_lowercase[fvs+1])
        case Application(abstraction=abs, operand=op):
            return Application(abstraction=add_names(fvs,abs), operand=add_names(fvs, op))

def remove_names(fvs: list[str], t: Term[str]) -> Term[int]:
    match t:
        case Variable(index=name):
            rightmost_index = fvs[::-1].index(name)
            return Variable(index=rightmost_index)
        case Abstraction(term=term,name=name) if name is not None:
            return Abstraction(term=remove_names([*fvs, name], term))
        case Abstraction():
            raise AssertionError
        case Application(abstraction=abs, operand=op):
            return Application(abstraction=remove_names(fvs,abs), operand=remove_names(fvs, op))
