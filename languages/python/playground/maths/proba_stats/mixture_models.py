import numpy as np
from numpy.random import Generator

from maths.proba_stats.utils import Dist, distribution

RNG = np.random.default_rng(seed=42)


def binary_vector(dim_or_dist: int | Dist, size=5000, rng: Generator = RNG):
    match dim_or_dist:
        case np.ndarray() as dist if len(dist.shape) == 1:
            bernoulli_params = dist
            dim = dist.shape[0]
        case int() as dim:
            bernoulli_params = rng.random(dim)
        case _:
            raise AssertionError

    samples = rng.random(size=(size, dim))
    return (samples < bernoulli_params.reshape(1, -1)).astype(np.int_)
