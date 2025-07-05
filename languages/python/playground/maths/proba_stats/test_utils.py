import numpy as np
from hypothesis import given, settings, strategies as st

from maths.proba_stats.utils import distribution, one_hot


@given(
    seed=st.integers(min_value=42),
    dist_size=st.integers(min_value=2, max_value=50),
    size=st.integers(min_value=5000, max_value=100_000),
)
@settings(max_examples=50)
def test_one_hot(seed, dist_size, size):
    RNG = np.random.default_rng(seed=seed)

    dist = distribution(dist_size, 1).reshape(dist_size)
    one_hot_s = one_hot(dist, size, rng=RNG)

    # Mindblown!!!
    assert np.isclose(dist, one_hot_s.mean(axis=0), atol=0.03).all()
