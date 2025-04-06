"""tl;dr: The types in the match patterns have to be a real type! A newtype won't do it"""

from abc import ABC, abstractmethod
from functools import reduce
from typing import Generic, assert_never, NamedTuple, NewType, Protocol, TypeVar, Union

###########
# NewType #
###########
idA = NewType("idA", int)
idB = NewType("idB", int)


def nt_f(x: idA) -> idA:
    return x


# Does not typecheck
# nt_f(5)
nt_f(idA(5))


def nt_g(x: int) -> int:
    return x


## This does typecheck!!
# Because idA is a "subtype of int"
# In way it's automatically coerced "up"
nt_g(idA(5))


##################################################################################
# A sumtype that is pattern matchable requires different runtime representations #
##################################################################################
# We cannot have a true sum type if the members do not have different **runtime** representations
class ST:
    pass


idA = NewType("idA", ST)
idB = NewType("idB", ST)

# def st_f(x: Union[idA, idB]):
#     match x:
#         case idA():  # Not a class
#             print("I am an idA")
#         case idB():  # Not a class
#             print("I am an idB")


class idC(NamedTuple):
    val: int


class idD(NamedTuple):
    val: int


def st_g(x: Union[idC, idD]):
    match x:
        case idC():
            print("I am an idC")
        case idD():
            print("I am an idD")


st_g(idC(5))

type idE = ST
type idF = ST

# def st_h(x: Union[idE, idF]):
#     match x:
#         case idE():  # TypeAliasType is not a class
#             print("I am an idC")
#         case idF():  # TypeAliasType is not a class
#             print("I am an idD")


####################
# Pattern matching #
####################
class A:
    pass


class B:
    pass


class C:
    pass


def pm_f(x: A | B, y: A | B | C):
    match x:
        case A():
            pass
        case B():
            pass
        case _:
            assert_never(x)


def pm_g(x: A | B, y: A | B | C):
    match (x, y):
        case (A(), A()):
            pass
        case (x, y):
            pass
        case _:
            assert_never(x)


########################
# Protocols & Generics #
########################
# Generic protocols simple example
ConstraintedTypes = (int, str, float)


class PCallable[T](Protocol):
    def __call__(self, arg: list[T]) -> T: ...


def p_dosomething[T](arg: T, c: PCallable[T]) -> T:
    return c([arg])


def p_f(arg: list[float]) -> float:
    return arg[0]


yo = p_dosomething(5.0, p_f)


# Generics as part of a union
class GCallable[T](ABC):
    @abstractmethod
    def __call__(self, arg: list[T]) -> T: ...


type TOrCallableT[T] = T | GCallable[T]


def p_somethingelse[T: (int, str, float)](arg: T, f: TOrCallableT[T]) -> T:
    match f:
        case GCallable() as c:
            return c([arg, arg, arg])
        case x:
            return x


class G_f[T: (int, str, float)](GCallable[T]):
    def __call__(self, arg: list[T]) -> T:
        return reduce(lambda x, y: x + y, arg, arg[0])


class G_f2(GCallable[int]):
    def __call__(self, arg: list[int]) -> int:
        return arg[0]


# Infers r as float
r = p_somethingelse(5.0, G_f())
r = p_somethingelse(5.0, 10.0)
# Infers r as int
r = p_somethingelse(5, G_f())
# Infers r as str
r = p_somethingelse("yo", G_f())

# Does not typecheck as expected (not that if there were no constraints on T it would work and
# infer the union
# r = p_somethingelse("yo", 5)

r = p_somethingelse(5, G_f2())
# Does not typecheck as you'd expect
# r = p_somethingelse(5.5, G_f2())
# r = p_somethingelse("yo", G_f2())
