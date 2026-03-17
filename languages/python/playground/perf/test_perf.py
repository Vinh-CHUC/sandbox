import numpy as np


def simple_calculation():
    N = 1_000_000

    x = [1.0] * N
    v = [0.5] * N
    dt = 0.01

    for i in range(N):
        x[i] += v[i] * dt


def simple_calculation_numpy():
    N = 1_000_000

    x = np.full(N, 1.0)
    v = np.full(N, 0.5)
    dt = 0.01

    x += v * dt


def test_simple_calculation(benchmark):
    benchmark(simple_calculation)


def test_simple_calculation_numpy(benchmark):
    benchmark(simple_calculation_numpy)
