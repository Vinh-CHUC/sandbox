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


def binary_vector_mixtures(
    dim_or_dist: tuple[int, int] | Dist,
    mixture_weights: Dist,
    size=5000,
    rng: Generator = RNG,
):
    match dim_or_dist:
        case np.ndarray() as dist if (
            len(dist.shape) == 2 and dist.shape[0] == mixture_weights.shape[0]
        ):
            bernoulli_mixture_params = dist
            dims = dist.shape
        case (int(), int()) as dims if dims[0] == mixture_weights.shape[0]:
            bernoulli_mixture_params = rng.random(size=dims)
        case _:
            raise AssertionError

    # 1-Dimensional simply the samples of "cluster id"
    cluster_selections = rng.choice(
        mixture_weights.shape[0], size=size, p=mixture_weights.flatten()
    )

    # Interestingly here we draw only one sample, the sampling is done just before really
    samples = rng.binomial(n=1, p=bernoulli_mixture_params[cluster_selections])
    return samples
