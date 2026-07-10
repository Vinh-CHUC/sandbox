"""
PROBLEM SPECIFICATION: The WiFi Router Placement Problem
========================================================
We want to optimize the placement and power of 3 WiFi routers in a 2D house.

- Grid: 10x10 cells (from (0,0) to (9,9)).
- Decision Variables (for each of the 3 routers):
  1. X coordinate: discrete integer [0, 9]
  2. Y coordinate: discrete integer [0, 9]
  3. Power (P): continuous float [1.0, 5.0]
- Physical Propagation:
  The signal strength at a grid cell from router i is: Signal = P_i / (1 + d^2)
  where d is the Euclidean distance between the cell and the router.
  The total signal at any cell is the MAXIMUM signal received from any individual router.
- Objective:
  Minimize the number of "Dead Zones" (grid cells where total signal strength < 0.5).
- Constraints:
  High-power routers are expensive: Cost = P^2.
  The sum of the costs of all 3 routers must not exceed a BUDGET of 15.0.
"""

import numpy as np


from pymoo.core.problem import Problem
from pymoo.optimize import minimize as pymoo_minimize
from pymoo.algorithms.soo.nonconvex.ga import GA
from pymoo.core.result import Result as PyMooResult

GRID_SIZE: tuple[int, int] = (100, 100)


class TowerDefense(Problem):
    """
    Object-oriented formulation of the optimization problem.
    Minimizes f(x, y) = (x - 1)^2 + (y - 2.5)^2
    subject to x + 2y <= 4, x >= 0, y >= 0.
    """

    def __init__(self) -> None:
        super().__init__(
            # the x variables will be of shape [population_size, n_var]
            # Btw individual ~ solution in this jargon
            n_var=len(GRID_SIZE),
            # Obviously > 1 would mean multi-objective
            n_obj=1,
            # > 1 => key "G" has to be present in the output dict of _evaluate()
            n_ieq_constr=1,
            # Bounds for the population
            # for each of xl/xu, the shape is [n_var]
            xl=np.array([0.0, 0.0]),
            xu=np.array(GRID_SIZE),
        )

    def _evaluate(self, x: np.ndarray, out: dict, *args, **kwargs) -> None:
        f = (x[:, 0] - 1.0) ** 2 + (x[:, 1] - 2.5) ** 2
        g = x[:, 0] + 2.0 * x[:, 1] - 4.0

        # "Function values", has to have the sahep [N, n_obj]
        out["F"] = f
        # "Constraint" value <= 0 constraint satisfied, has to have the shape [N, n_ieq_constr]
        out["G"] = g

    @classmethod
    def solve(cls, seed: int = 1) -> PyMooResult:
        """
        Solves the simple problem using the standard OO interface of PyMoo.
        """
        problem = cls()
        algorithm = GA(pop_size=50, eliminate_duplicates=True)
        res = pymoo_minimize(
            problem, algorithm, termination=("n_gen", 100), seed=seed, verbose=False
        )
        return res
