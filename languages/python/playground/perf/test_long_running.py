import numpy as np
from time import sleep


def intensive_numpy_task(size=200, iterations=8):
    """
    Performs multiple matrix multiplications to keep the CPU busy for ~10 seconds.
    """
    result = np.zeros((size, size))
    for _ in range(iterations):
        a = np.random.rand(size, size)
        b = np.random.rand(size, size)
        result += np.dot(a, b)
    return np.sum(result)


def intensive_pure_python_task(limit=2500):
    """
    A pure Python loop that performs arithmetic to keep the CPU busy for a while.
    """
    total = 0
    sleep(5)
    for i in range(limit):
        if i % 2 == 0:
            total += i
        else:
            total -= i // 2
    return total


def test_numpy_heavy_workload(benchmark):
    benchmark.pedantic(intensive_numpy_task, rounds=2, iterations=1)


def test_pure_python_workload(benchmark):
    benchmark.pedantic(intensive_pure_python_task, rounds=2, iterations=1)
