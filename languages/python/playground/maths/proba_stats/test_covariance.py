import numpy as np
from hypothesis import given, settings, strategies as st


@given(size=st.integers(min_value=100, max_value=1000))
@settings(max_examples=50)
def test_covariance_as_an_inner_product(size):
    RNG = np.random.default_rng(seed=size)

    x = RNG.uniform(size=size)
    y = RNG.uniform(size=size)
    cov = np.cov(np.array([x, y]), bias=True)[0][1]
    dot = np.dot(x - x.mean(), y - y.mean()) / size
    assert np.isclose(cov, dot)


@given(size=st.integers(min_value=100, max_value=1000))
@settings(max_examples=50)
def test_cauchy_schwarz(size):
    RNG = np.random.default_rng(seed=size)

    x = RNG.uniform(size=size)
    y = 5 * x
    assert np.isclose(
        best_cov := np.cov(np.array([x, y]), bias=True)[0][1], x.std() * y.std()
    )
    RNG.shuffle(y)
    assert abs(np.cov(np.array([x, y]), bias=True)[0][1]) < best_cov
