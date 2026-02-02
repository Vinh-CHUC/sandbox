import numpy as np
from numpy.typing import NDArray

from numba import float64, int64, njit


def make_rng():
    return np.random.default_rng(seed=0)


@njit(float64[:](float64[:], float64[:]))
def numba_add(x, y):
    return x + y


def baseline_add(x: NDArray[np.float64], y: NDArray[np.float64]) -> NDArray[np.float64]:
    return x + y


# Annotate with numba types (like numba_add)
@njit(float64[:](float64[:], float64[:, :], float64[:], int64))
def numba_logistic_regression(Y, X, w, iterations):
    for i in range(iterations):
        w -= np.dot(((1.0 / (1.0 + np.exp(-Y * np.dot(X, w))) - 1.0) * Y), X)
    return w


# Create baseline_logistic_regression
def baseline_logistic_regression(
    Y: NDArray[np.float64],
    X: NDArray[np.float64],
    w: NDArray[np.float64],
    iterations: int,
) -> NDArray[np.float64]:
    for i in range(iterations):
        w -= np.dot(((1.0 / (1.0 + np.exp(-Y * np.dot(X, w))) - 1.0) * Y), X)
    return w


def test_addition_numba(benchmark):
    rng = make_rng()
    x = rng.random(size=100)
    y = rng.random(size=100)
    benchmark(numba_add, x, y)


def test_addition_base(benchmark):
    rng = make_rng()
    x = rng.random(size=100)
    y = rng.random(size=100)
    benchmark(baseline_add, x, y)


# Create a pair of benchmarks similar to the two above
def test_logistic_regression_numba(benchmark):
    rng = make_rng()
    N, M = 1000, 10
    X = rng.random((N, M))
    Y = rng.random(N)
    w = rng.random(M)
    iterations = 10
    benchmark(numba_logistic_regression, Y, X, w, iterations)


def test_logistic_regression_base(benchmark):
    rng = make_rng()
    N, M = 1000, 10
    X = rng.random((N, M))
    Y = rng.random(N)
    w = rng.random(M)
    iterations = 10
    benchmark(baseline_logistic_regression, Y, X, w, iterations)
