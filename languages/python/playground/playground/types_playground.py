"""
tl;dr: The types in the match patterns have to be a real type! A newtype won't do it
"""
from collections import namedtuple
from dataclasses import dataclass
from typing import assert_never, NamedTuple, NewType, Union, TypeVar, List

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

# Will fail
# g(idA(5))

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

@dataclass
class Data:
    x: int

idE = NewType('idE', Data)
idF = NewType('idF', Data)

def i(x: Union[idE, idF]):
    match x:
        ## Will fail at runtime with "called match pattern must be a type
        case idE():
            print("I am an idC")
        case idF():
            print("I am an idD")

#######################
# Generics playground #
#######################
class A:
    pass
class B:
    pass
class C:
    pass

a = A()
getattr(a, "id")


####################
# Pattern matching #
####################
def f(x: A | B, y: A | B | C):
    match x:
        case A():
            pass
        case B():
            pass
        case _:
            assert_never(x)


def g(x: A | B, y: A | B | C):
    arg = (x, y)
    match arg:
        case (A(), A()):
            pass
        case (x, y):
            pass
        case _:
            assert_never(arg)
