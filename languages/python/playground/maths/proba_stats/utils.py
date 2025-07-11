from typing import NewType

import numpy as np
import numpy.typing as npt
from numpy.random import Generator

RNG = np.random.default_rng(seed=42)

Dist = NewType("Dist", npt.NDArray)


def distribution(dim: int, size: int, rng: Generator = RNG) -> Dist:
    d = rng.dirichlet(rng.integers(1, 20, size=dim), size=size)
    if size == 1:
        d = d.reshape(-1)
    return Dist(d)


def one_hot(dist: Dist, size, rng: Generator = RNG):
    n = len(dist)
    choices = rng.choice(range(n), p=dist, size=size)
    return np.eye(n)[choices]
