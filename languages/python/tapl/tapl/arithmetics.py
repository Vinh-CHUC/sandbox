from typing import Callable, TypeVar

def pair(a, b):
    return lambda f: f(a, b)

def fst(p):
    return p(lambda x,y: x)
    
def snd(p):
    return p(lambda x,y: y)

my_pair = pair(3, 4)
assert(fst(my_pair)) == 3
assert(snd(my_pair)) == 4

## Numerals
T = TypeVar("T")

type ChurchNum[T] = Callable[[Callable[[T], T], T], T]

ZERO : ChurchNum = lambda s, z: z

def scc(n: ChurchNum) -> ChurchNum:
    return lambda s, z: n(s, s(z))

THREE = scc(scc(scc(ZERO)))
assert THREE(lambda x: x + 1, 0) == 3

def plus(m: ChurchNum, n: ChurchNum):
    return lambda s, z: m(s, n(s, z))

def plus_curry(m: ChurchNum):
    return lambda n: lambda s, z: m(s, n(s, z))

assert plus(THREE, THREE)(lambda x: x + 1, 0) == 6

def times(m: ChurchNum, n: ChurchNum):
    return m(plus_curry(n), ZERO)

assert times(THREE, THREE)(lambda x: x + 1, 0) == 9
