from typing import Callable




def HomFunctor[Repr, X, Y](
    R: Callable[[Repr], X],
    F: Callable[[X], Y]
) -> Callable[[Repr], Y]:
    return lambda x: F(R(x))


# Component of the natural transformation on X
# the "Functor" is list
def Phi[Repr, X](
    repr_el: list[Repr],
    a_to_x: Callable[[Repr], X]
) -> list[X]:
	return list(map(a_to_x, repr_el))
