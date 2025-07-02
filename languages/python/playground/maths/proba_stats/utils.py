from typing import NewType

import numpy as np
import numpy.typing as npt

RNG = np.random.default_rng(seed=42)

Dist = NewType("Dist", npt.NDArray)


def distribution(size: int) -> Dist:
    return Dist(RNG.dirichlet(RNG.integers(1, 20, size=size)))


def one_hot(dist: Dist, size):
    n = len(dist)
    choices = RNG.choice(range(n), p=dist, size=size)
    return np.eye(n)[choices]
