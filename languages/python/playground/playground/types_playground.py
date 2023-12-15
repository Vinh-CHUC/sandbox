from collections import namedtuple
from typing import NamedTuple, NewType, Union

idA = NewType('idA', int)
idB = NewType('idB', int)

def f1(x: idA) -> idA:
    return x

# Does not typecheck
# f1(5)
f1(idA(5))

def f2(x: int) -> int:
    return x

## This does typecheck!!
# Because idA is a "subtype of int"
# In way it's automatically coerced "up" 
f2(idA(5))

# We cannot have a true sum type if the members do not have different **runtime** representations
def g(x: Union[idA, idB]):
    match x:
        ## Will fail at runtime with "called match pattern must be a type
        case idA():
            print("I am an idA")
        case idB():
            print("I am an idB")

class idC(NamedTuple):
    val: int

class idC2(idC):
    pass

class idD(NamedTuple):
    val: int

def h(x: Union[idC, idD]):
    match x:
        case idC():
            print("I am an idC")
        case idD():
            print("I am an idD")
