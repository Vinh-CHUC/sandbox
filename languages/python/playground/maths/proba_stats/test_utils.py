import numpy as np

from maths.proba_stats.utils import distribution, one_hot


def test_one_hot():
    for _ in range(50):
        dist = distribution(10)
        one_hot_s = one_hot(dist, 5000)

        # Mindblown!!!
        assert np.isclose(dist, one_hot_s.mean(axis=0), atol=0.03).all()
