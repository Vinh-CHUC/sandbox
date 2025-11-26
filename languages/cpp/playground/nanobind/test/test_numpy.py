import numpy as np

import nanobind
from nanobind.nanobind_playground import add
from nanobind.nanobind_playground.numpy import inspect

def test_dummy():
    add(1, 2)
    inspect(np.eye(10))
