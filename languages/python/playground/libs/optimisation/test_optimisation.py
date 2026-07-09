import numpy as np
from libs.optimisation import ProblemA


def test_oo_problem_optimization():
    # Solve standard OO problem
    res = ProblemA.solve(seed=42)

    assert res.X is not None
    assert res.F is not None

    # Check if the constraint x + 2y <= 4 holds
    x, y = res.X[0], res.X[1]
    assert x + 2.0 * y <= 4.0 + 1e-4

    # Check if we are close to the analytical optimum (0.6, 1.7)
    # GA might not get exactly 0.6, 1.7 due to stochastic nature, but should be very close
    np.testing.assert_allclose(res.X, np.array([0.6, 1.7]), atol=0.05)
    np.testing.assert_allclose(res.F, np.array([0.8]), atol=0.05)
