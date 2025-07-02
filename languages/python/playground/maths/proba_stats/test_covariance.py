import numpy as np

RNG = np.random.default_rng(42)
SIZE = 100


def test_covariance_as_an_inner_product():
    x = RNG.uniform(size=SIZE)
    y = RNG.uniform(size=SIZE)
    assert np.isclose(
        np.cov(np.array([x, y]), bias=True)[0][1],
        np.dot(x - x.mean(), y - y.mean()) / SIZE,
    )


def test_cauchy_schwarz():
    x = RNG.uniform(size=SIZE)
    y = 5 * x
    assert np.isclose(
        best_cov := np.cov(np.array([x, y]), bias=True)[0][1], x.std() * y.std()
    )
    RNG.shuffle(y)
    assert abs(np.cov(np.array([x, y]), bias=True)[0][1]) < best_cov
