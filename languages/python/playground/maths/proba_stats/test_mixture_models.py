import numpy as np
from hypothesis import given, settings, strategies as st
from numpy._core.fromnumeric import diagonal

from maths.proba_stats import mixture_models


@given(
    seed=st.integers(min_value=42),
    dim=st.integers(min_value=2, max_value=50),
    size=st.integers(min_value=5000, max_value=100_000),
)
@settings(max_examples=50)
def test_binary_vectors(seed, dim, size):
    RNG = np.random.default_rng(seed=seed)

    bernoullis = RNG.random(size=dim)

    samples = mixture_models.binary_vector(dim_or_dist=bernoullis, size=size, rng=RNG)

    # The means are the bernoullis params
    assert np.isclose(samples.mean(axis=0), bernoullis, atol=0.03).all()

    # The variances are the bernoulli variances
    cov = np.cov(samples, bias=True, rowvar=False)
    assert np.isclose((bernoullis * (1 - bernoullis)), cov.diagonal(), atol=0.03).all()

    # The covariances are 0
    assert np.isclose(cov - (cov.diagonal() * np.eye(cov.shape[0])), 0, atol=0.03).all()
