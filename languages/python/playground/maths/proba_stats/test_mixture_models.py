import numpy as np
import pandas as pd
from hypothesis import given, settings, strategies as st

from maths.proba_stats import mixture_models
from maths.proba_stats.utils import distribution, Dist


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


class TestBinaryVectorMixtures:
    @given(
        seed=st.integers(min_value=42),
        size=st.integers(min_value=5000, max_value=100_000),
    )
    @settings(max_examples=10)
    def test_binary_mixtures(self, seed, size):
        """
        A classic example, each component has 0 covariance
        BUT when mixing this is not the case anymore
        """
        dist = np.array([[0.1, 0.9], [0.9, 0.1]])
        mixture_weights = np.array([0.5, 0.5])

        samples = mixture_models.binary_vector_mixtures(
            Dist(dist),
            Dist(mixture_weights),
            rng=np.random.default_rng(seed=seed),
            size=size,
        )

        df = pd.DataFrame(samples, columns=["a", "b"])
        # The essence of it, given an observation we got more information about which cluster
        # we're likely in. Which in turns gives information about the other one
        assert (df[df.b == 0].a.mean() - df[df.b == 1].a.mean()) > 0.5

    @given(
        seed=st.integers(min_value=42),
        dim=st.integers(min_value=5, max_value=10),
        n_mixtures=st.integers(min_value=5, max_value=10),
        size=st.integers(min_value=5000, max_value=20_000),
    )
    @settings(max_examples=10)
    def test_binary_mixtures_2(self, seed, dim, n_mixtures, size):
        """
        A classic example, each component has 0 covariance
        BUT when mixing this is not the case anymore
        """
        RNG = np.random.default_rng(seed=seed)
        dist = RNG.random((n_mixtures, dim))
        mixture_weights = distribution(n_mixtures, 1, RNG).flatten()

        samples = mixture_models.binary_vector_mixtures(
            Dist(dist),
            Dist(mixture_weights),
            rng=np.random.default_rng(seed=seed),
            size=size,
        )

        corrs = np.corrcoef(samples, rowvar=False)
        corrs = (corrs - (corrs.diagonal() * np.eye(corrs.shape[0]))).flatten()

        # At least a decent of number of correlations are relatively high
        assert (np.abs(corrs) > 0.01).sum() > (corrs.shape[0] / 10)
