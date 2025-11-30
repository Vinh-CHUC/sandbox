import numpy as np

from nanobind_playground import add
from nanobind_playground.numpy import inspect

def test_dummy():
    add(1, 2)
    # inspect(np.eye(10))
