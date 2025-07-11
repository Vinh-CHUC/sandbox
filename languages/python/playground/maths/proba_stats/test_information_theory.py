import numpy as np
import pandas as pd
from hypothesis import given, settings, strategies as st

from maths.proba_stats.information_theory import cross_entropy, entropy
from maths.proba_stats.utils import distribution, Dist


@given(seed=st.integers(min_value=42), dim=st.integers(min_value=2, max_value=12))
@settings(max_examples=50)
def test_binary_vectors(seed, dim):
    RNG = np.random.default_rng(seed=seed)

    p = distribution(dim=dim, size=1)
    q = np.copy(p)
    RNG.shuffle(q)

    assert cross_entropy(p, q) >= entropy(p)
    assert cross_entropy(p, p[::-1]) > entropy(p)
