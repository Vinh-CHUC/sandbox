from enum import Enum
from typing import assert_never, Any, Union, List

import numpy as np
import jax
import jax.numpy as jnp
from numpy.core.multiarray import where

L = 10**6


def some_fn(a: float, b: float):
    if a > b:
        return a - b
    else:
        return a + b


class Variant(Enum):
    BASELINE = 1
    NUMPY = 2
    JAX = 3


def baseline(variant: Variant):
    match variant:
        case Variant.BASELINE:
            return [10.0 * 1 for _ in range(L)]
        case Variant.NUMPY:
            return 10.0 * np.ones(L)
        case Variant.JAX:
            return 10.0 * jnp.ones(L)


# GOTCHA!
# The vectorize function is provided for convenience, not for performance. The implementation is
# essentially a for loop
NPFUNC = np.vectorize(some_fn)
JAXFUNC = jax.vmap(some_fn, in_axes=[0, None])


def vectorize(input: Union[np.ndarray, jnp.ndarray, List[Any]]) -> object:
    match input:
        case list():
            return [some_fn(x, L // 2) for x in input]
        case np.ndarray():
            return np.where(input > L // 2, input - L // 2, input + L // 2)
        case jnp.ndarray():
            return jnp.where(input > L // 2, input - L // 2, input + L // 2)
        case _:
            assert_never(input)


"""
base = baseline(Variant.BASELINE)
nparr = baseline(Variant.NUMPY)
jnparr = baseline(Variant.JAX)

%timeit baseline(Variant.BASELINE)
%timeit baseline(Variant.NUMPY)
%timeit baseline(Variant.JAX)

%timeit vectorize(base)
%timeit vectorize(nparr)
%timeit vectorize(jnparr)
"""
