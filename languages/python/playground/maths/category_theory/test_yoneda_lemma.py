"""
TODO: Use variants of Phi that might shuffle the input list
"""
from typing import Callable

import numpy as np
from hypothesis import given, settings, strategies as st

from maths.category_theory.yoneda_lemma import(
    HomFunctor,
    Phi
)


@given(
    seed=st.integers(min_value=42),
    size=st.integers(min_value=5, max_value=20),
)
@settings(max_examples=50)
def test_naturality_condition(seed, size):
    RNG = np.random.default_rng(seed=seed)
    REPR_EL: list[int] = list(RNG.integers(low=0, high=100, size=size))

    id_repr: Callable[[int], int] = lambda x: x  # noqa: E731
    f: Callable[[int], str] = lambda x: str(x)  # noqa: E731

    #############################################
    # Left + bottom part of the diagram chasing #
    #############################################
    u = Phi(REPR_EL, id_repr)
    left_bot_path = list(map(f, u))

    ######################################
    # Top + Right of the diagram chasing #
    ######################################
    also_f = HomFunctor(id_repr, f)

    # This is the key for the naturality condition to hold
    # It's parametrised by REPR_EL
    top_right_path = Phi(u, also_f)

    assert top_right_path == left_bot_path


# Pretending that this is Fin n in Haskell
type int_lt_size = int

@given(
    seed=st.integers(min_value=42),
    size=st.integers(min_value=5, max_value=20),
)
@settings(max_examples=50)
def test_natural_isomorphism(seed, size):
    RNG = np.random.default_rng(seed=seed)
    REPR_EL: list[int] = list(RNG.integers(low=0, high=100, size=size))

    F: Callable[[int_lt_size], str] = lambda x: str(x)  # noqa: E731

    # ~tabulate in Haskell
    # Here we can see very clearly the yoneda lemma
    # There are as many choices of tabulate as there are REPR_EL
    tabulate: Callable[[Callable[[int_lt_size], str]], list[str]] = (  # noqa: E731
        lambda f: Phi(REPR_EL, f)
    )
    PhiStrF = tabulate(F)

    # ~index in haskell
    F2: Callable[[int_lt_size], str] = lambda x: PhiStrF[REPR_EL.index(x)]  # noqa: E731

    for s in range(size):
        assert F(REPR_EL[s]) == F2(REPR_EL[s])
