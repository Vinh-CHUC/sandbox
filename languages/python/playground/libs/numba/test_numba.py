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


# --- Grid itinerary -----------------------------------------------------------
# A walker greedily steps onto the lowest-valued *unvisited* cell of its 3x3 neighbourhood,
# tick after tick, until it is boxed in or runs out of ticks. Each tick depends on the
# previous one, so the outer loop cannot be vectorised away: numpy only gets to shave the
# 3x3 scan, and pays full per-call overhead on 9 elements to do it.


def grid_walk(grid, start_r, start_c, max_ticks):
    n, m = grid.shape
    visited = np.zeros((n, m), np.bool_)
    path = np.empty((max_ticks, 2), np.int64)
    r, c, ticks = start_r, start_c, 0
    while ticks < max_ticks:
        path[ticks, 0] = r
        path[ticks, 1] = c
        visited[r, c] = True
        ticks += 1
        r0, c0 = max(r - 1, 0), max(c - 1, 0)
        # already-visited cells (the current one included) are ruled out with +inf
        window = np.where(
            visited[r0 : r + 2, c0 : c + 2], np.inf, grid[r0 : r + 2, c0 : c + 2]
        )
        flat = np.argmin(window)
        if not np.isfinite(window.ravel()[flat]):
            break  # boxed in: itinerary over
        r, c = r0 + flat // window.shape[1], c0 + flat % window.shape[1]
    return path[:ticks]


numba_grid_walk = njit(int64[:, :](float64[:, :], int64, int64, int64))(grid_walk)


# 1080**2 ~= the 1,167,132 H3 res-7 cells tiling the GIUK gap: lon -45..15, lat 55..70
# (the extent of ~/Code/projects/stingray/OCEAN_GIUK.nc, itself a 667x334 1/12-degree grid)
def make_grid(size: int = 1080) -> NDArray[np.float64]:
    return make_rng().random((size, size))


ITINERARY = (540, 540, 20_000)  # start row, start col, max ticks


def test_grid_walk_agree():
    grid = make_grid()
    reference = grid_walk(grid, *ITINERARY)
    # the walker boxed itself in (rather than hitting the cap), well after the start
    assert 100 < len(reference) < ITINERARY[-1]
    assert np.array_equal(reference, numba_grid_walk(grid, *ITINERARY))


def test_grid_walk_numba(benchmark):
    grid = make_grid()
    benchmark(numba_grid_walk, grid, *ITINERARY)


def test_grid_walk_base(benchmark):
    grid = make_grid()
    benchmark(grid_walk, grid, *ITINERARY)
